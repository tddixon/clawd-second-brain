#!/bin/bash

# Create ClickUp task + Obsidian task for Nomads profitability forecast

CLICKUP_API_TOKEN="$CLICKUP_API_TOKEN"
CLICKUP_TEAM_ID="$CLICKUP_TEAM_ID"
OBSIDIAN_VAULT="${OBSIDIAN_VAULT:-/home/desktop/obsidian-vault}"

CLICKUP_BASE_URL="https://api.clickup.com/api/v2"

# Task details
TASK_NAME="Self-management profitability forecast - hostel acquisitions"
TASK_DESCRIPTION="Build spreadsheet showing revenue projections comparing:
- (A) Self-managed model with 10% margin
- (B) Current franchise model

Given 2.3M THB renovation spend upfront.

**Notes to verify:**
- Current situation: Multi-hostel operation under franchise model
- Renovation spend: 2.3M THB (assumption - please verify)
- Margin assumption: 10% for self-managed (please confirm)
- Strategic questions to answer:
  - Acquisition budget?
  - Hostel count for projection?

**Spreadsheet scenarios:**
- Scenario A: All self-managed (10% margin)
- Scenario B: Mix of self-managed + franchise
- Timeline: 3-5 years projection

**Metrics to track:**
- RevPAR (revenue per available room)
- RevPAC (revenue per available room)
- Occupancy
- Marketing costs
- Staffing

**Questions for Trevor:**
1. What's the deadline for this analysis?
2. What is the current hostel count?
3. What's the acquisition budget?
4. Any additional assumptions or constraints?"

echo "🔍 Finding Nomads Current folder..."

# Get Nomads space
SPACES=$(curl -s -X GET "$CLICKUP_BASE_URL/team/$CLICKUP_TEAM_ID/space" \
  -H "Authorization: $CLICKUP_API_TOKEN" \
  -H "Content-Type: application/json")

NOMADS_SPACE_ID=$(echo "$SPACES" | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf-8')).spaces.find(s => s.name === 'Nomads').id)")

if [ -z "$NOMADS_SPACE_ID" ]; then
  echo "❌ Nomads space not found"
  exit 1
fi

echo "✅ Found Nomads space: $NOMADS_SPACE_ID"

# Get folders
FOLDERS=$(curl -s -X GET "$CLICKUP_BASE_URL/space/$NOMADS_SPACE_ID/folder" \
  -H "Authorization: $CLICKUP_API_TOKEN" \
  -H "Content-Type: application/json")

CURRENT_FOLDER_ID=$(echo "$FOLDERS" | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf-8')).folders.find(f => f.name === 'Current').id")

if [ -z "$CURRENT_FOLDER_ID" ]; then
  echo "❌ Current folder not found"
  exit 1
fi

echo "✅ Found Current folder: $CURRENT_FOLDER_ID"

# Get the Marketing list in Current folder
TARGET_LIST_ID=$(echo "$FOLDERS" | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf-8')).folders.find(f => f.name === 'Current').lists.find(l => l.name === 'Marketing').id")

if [ -z "$TARGET_LIST_ID" ] || [ "$TARGET_LIST_ID" == "undefined" ]; then
  # Fallback to first list
  TARGET_LIST_ID=$(echo "$FOLDERS" | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf-8')).folders.find(f => f.name === 'Current').lists[0].id)")
fi

echo "✅ Using list ID: $TARGET_LIST_ID"

# Create ClickUp task
echo ""
echo "📝 Creating ClickUp task..."

RESPONSE=$(curl -s -X POST "$CLICKUP_BASE_URL/list/$TARGET_LIST_ID/task" \
  -H "Authorization: $CLICKUP_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$TASK_NAME\",
    \"description\": \"$TASK_DESCRIPTION\",
    \"priority\": 2,
    \"tags\": [\"finance\", \"strategy\", \"business-model\", \"nomads\"]
  }")

TASK_ID=$(echo "$RESPONSE" | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf-8')).id)")
TASK_URL=$(echo "$RESPONSE" | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf-8')).url)")

if [ -z "$TASK_ID" ] || [ "$TASK_ID" == "null" ]; then
  echo "❌ Failed to create ClickUp task"
  echo "Response: $RESPONSE"
  exit 1
fi

echo "✅ ClickUp task created: $TASK_ID"
echo "   URL: $TASK_URL"

# Create Obsidian task
echo ""
echo "📝 Creating Obsidian task..."

CURRENT_DATE=$(date +%Y-%m-%d)
CU_ID="[CU-$TASK_ID]"

# Build Obsidian task as a heredoc
cat > /tmp/obsidian_task.txt << 'EOFMARKER'
- [ ] TASKNAME_PLACEHOLDER 🔺 CUID_PLACEHOLDER #finance #business-model #strategy #nomads
  📍 [[1-Projects/Nomads/Active|Nomads Active]]
  **Created:** CURRENTDATE_PLACEHOLDER
  **Priority:** High
  **Status:** Questions to answer

  ---
  **Notes:**
  TASKDESCRIPTION_PLACEHOLDER

  **Questions for Trevor:**
  1. What's the deadline for this analysis?
  2. What is the current hostel count?
  3. What's the acquisition budget?
  4. Any additional assumptions or constraints?

  ---
  **ClickUp:** TASKURL_PLACEHOLDER
EOFMARKER

# Replace placeholders
sed -i "s|TASKNAME_PLACEHOLDER|$TASK_NAME|g" /tmp/obsidian_task.txt
sed -i "s|CUID_PLACEHOLDER|$CU_ID|g" /tmp/obsidian_task.txt
sed -i "s|CURRENTDATE_PLACEHOLDER|$CURRENT_DATE|g" /tmp/obsidian_task.txt
sed -i "s|TASKURL_PLACEHOLDER|$TASK_URL|g" /tmp/obsidian_task.txt

# Handle multi-line description
sed -i "/TASKDESCRIPTION_PLACEHOLDER/{
  r /dev/stdin
  d
}" /tmp/obsidian_task.txt <<< "  $TASK_DESCRIPTION"

OBSIDIAN_TASK=$(cat /tmp/obsidian_task.txt)

# Find the Obsidian file for Nomads Active
OBSIDIAN_PROJECT_PATH="$OBSIDIAN_VAULT/1-Projects/Nomads/Active/_summary.md"

# Ensure directory exists
mkdir -p "$(dirname "$OBSIDIAN_PROJECT_PATH")"

# Read existing file or create header
if [ -f "$OBSIDIAN_PROJECT_PATH" ]; then
  EXISTING_CONTENT=$(cat "$OBSIDIAN_PROJECT_PATH")
else
  EXISTING_CONTENT="# Nomads Active - Summary

> Last updated: $CURRENT_DATE

## 🔴 High Priority / Critical
"
fi

# Add task to High Priority section
if echo "$EXISTING_CONTENT" | grep -q "## 🔴 High Priority / Critical"; then
  # Insert after the section header using a temp file
  echo "$EXISTING_CONTENT" | awk "
    /## 🔴 High Priority \/ Critical/ {
      print
      print \"\"
      print \"$OBSIDIAN_TASK\"
      next
    }
    { print }
  " > /tmp/updated_obsidian.md
  mv /tmp/updated_obsidian.md "$OBSIDIAN_PROJECT_PATH"
else
  # Section doesn't exist, append at beginning
  UPDATED_CONTENT="## 🔴 High Priority / Critical
$OBSIDIAN_TASK

$EXISTING_CONTENT"
  echo "$UPDATED_CONTENT" > "$OBSIDIAN_PROJECT_PATH"
fi

echo "✅ Obsidian task created: $OBSIDIAN_PROJECT_PATH"

# Update ClickUp task with Obsidian link
echo ""
echo "📝 Updating ClickUp task with Obsidian link..."

UPDATED_TASK_DESCRIPTION="$TASK_DESCRIPTION

**Obsidian Link:** [[1-Projects/Nomads/Active/_summary.md]]"

curl -s -X PUT "$CLICKUP_BASE_URL/task/$TASK_ID" \
  -H "Authorization: $CLICKUP_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"description\": \"$UPDATED_TASK_DESCRIPTION\"
  }" > /dev/null

echo "✅ ClickUp task updated with Obsidian link"

# Cleanup
rm -f /tmp/obsidian_task.txt

# Summary
echo ""
echo "============================================================"
echo "✅ TASKS CREATED SUCCESSFULLY"
echo "============================================================"
echo ""
echo "**Task:** Self-management profitability forecast - hostel acquisitions"
echo "**ClickUp ID:** CU-$TASK_ID"
echo "**ClickUp URL:** $TASK_URL"
echo "**Obsidian Location:** [[1-Projects/Nomads/Active/_summary.md]]"
echo ""
echo "**Status:** Questions to answer from Trevor:"
echo "1. Deadline for analysis?"
echo "2. Current hostel count?"
echo "3. Acquisition budget?"
echo "4. Additional assumptions?"
echo ""
echo "============================================================"
