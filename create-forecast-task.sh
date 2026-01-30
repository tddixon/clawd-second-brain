#!/bin/bash

# Create ClickUp task + Obsidian task for Nomads profitability forecast
# Custom script for financial forecast task

CLICKUP_API_TOKEN="$CLICKUP_API_TOKEN"
CLICKUP_TEAM_ID="$CLICKUP_TEAM_ID"
OBSIDIAN_VAULT="${OBSIDIAN_VAULT:-/home/desktop/obsidian-vault}"

CLICKUP_BASE_URL="https://api.clickup.com/api/v2"

# Task details as specified by user
TASK_NAME="Self-management profitability forecast - hostel acquisitions"
TASK_DESCRIPTION="Build spreadsheet forecasting revenue/profitability if all hostels were self-managed (10% margin) vs continuing current franchise model. Assume 2.3M THB upfront renovation spend. Create scenario comparisons for 3.5 years projection. Include: ADR, occupancy, RevPAR, margin, ROI, break-even analysis.

**Notes:**
This is a strategic financial analysis task requiring:
- Spreadsheet creation (Google Sheets, Excel, or ClickUp's built-in)
- Financial modeling knowledge (assumptions about margins, occupancy, franchise fees)
- Data sources: ask Trevor where financial data comes from (POS system, booking engine, accounting)
- Timeline: 3.5 years of projections
- Key assumptions to verify: 10% self-managed margin, 2.3M THB renovation spend"

echo "🔍 Finding Nomads folder..."

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

# Use Month End Accounting list (most finance-relevant under Current folder)
TARGET_LIST_ID="901707394124"

if [ -z "$TARGET_LIST_ID" ] || [ "$TARGET_LIST_ID" == "undefined" ]; then
  echo "❌ Could not determine target list"
  exit 1
fi

echo "✅ Using Month End Accounting list (ID: $TARGET_LIST_ID)"

# Create ClickUp task
echo ""
echo "📝 Creating ClickUp task..."

RESPONSE=$(curl -s -X POST "$CLICKUP_BASE_URL/list/$TARGET_LIST_ID/task" \
  -H "Authorization: $CLICKUP_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$TASK_NAME\",
    \"description\": \"$TASK_DESCRIPTION\",
    \"priority\": 1,
    \"status\": \"to-do\",
    \"tags\": [\"finance\", \"business-model\", \"strategy\", \"nomads\"]
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

# Build Obsidian task - using proper format from skill
OBSIDIAN_TASK="- [ ] $TASK_NAME 🔺 $CU_ID #finance #business-model #strategy #nomads #context/computer #energy/high
  📍 [[1-Projects/Nomads/Active/_summary.md|Nomads Active]]
  **Created:** $CURRENT_DATE
  **Priority:** High (this affects all operations/business decisions)
  **Status:** to-do

  ---
  **Description:**
  Build spreadsheet forecasting revenue/profitability if all hostels were self-managed (10% margin) vs continuing current franchise model. Assume 2.3M THB upfront renovation spend. Create scenario comparisons for 3.5 years projection. Include: ADR, occupancy, RevPAR, margin, ROI, break-even analysis.

  **Notes:**
  This is a strategic financial analysis task requiring:
  - Spreadsheet creation (Google Sheets, Excel, or ClickUp's built-in)
  - Financial modeling knowledge (assumptions about margins, occupancy, franchise fees)
  - Data sources: ask Trevor where financial data comes from (POS system, booking engine, accounting)
  - Timeline: 3.5 years of projections
  - Key assumptions to verify: 10% self-managed margin, 2.3M THB renovation spend

  ---
  **ClickUp:** $TASK_URL"

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
rm -f /tmp/updated_obsidian.md

# Summary
echo ""
echo "============================================================"
echo "✅ TASKS CREATED SUCCESSFULLY"
echo "============================================================"
echo ""
echo "**Task:** Self-management profitability forecast - hostel acquisitions"
echo "**ClickUp ID:** CU-$TASK_ID"
echo "**ClickUp URL:** $TASK_URL"
echo "**ClickUp Location:** Nomads Space > Current Folder > Month End Accounting List"
echo "**Obsidian Location:** [[1-Projects/Nomads/Active/_summary.md]]"
echo ""
echo "**Next Steps:**"
echo "1. Verify assumptions with Trevor (10% margin, 2.3M THB renovation spend)"
echo "2. Ask Trevor about data sources (POS, booking engine, accounting)"
echo "3. Confirm 3.5-year projection timeline"
echo "4. Create spreadsheet with scenario comparisons"
echo ""
echo "**Tags:** #finance #business-model #strategy #nomads"
echo "**Priority:** High (affects all operations/business decisions)"
echo ""
echo "============================================================"
