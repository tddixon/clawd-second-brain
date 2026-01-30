#!/bin/bash
# Todoist → Obsidian One-Way Sync
# 
# Purpose: Mobile capture via Todoist app → Sync to Obsidian → Available for ClickUp
# Direction: ONE-WAY ONLY (Todoist → Obsidian)
# 
# Usage:
#   ./sync-todoist-to-obsidian.sh           # Run sync
#   ./sync-todoist-to-obsidian.sh --dry-run # Preview only
#   ./sync-todoist-to-obsidian.sh --setup-cron  # Add to cron

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VAULT_PATH="${VAULT_PATH:-/home/desktop/obsidian-second-brain}"
TASKS_DIR="${VAULT_PATH}/04-Tasks"
INBOX_DIR="${VAULT_PATH}/00-Inbox"
TODOIST_API="https://api.todoist.com/rest/v2"
DRY_RUN=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse arguments
if [[ "${1:-}" == "--dry-run" ]]; then
    DRY_RUN=true
    echo -e "${YELLOW}=== DRY RUN MODE ===${NC}"
    echo "No files will be written and no tasks will be deleted from Todoist."
    echo ""
fi

if [[ "${1:-}" == "--setup-cron" ]]; then
    echo "Setting up Todoist sync cron job..."
    
    # Check if already in crontab
    if crontab -l 2>/dev/null | grep -q "sync-todoist-to-obsidian"; then
        echo "⚠️  Todoist sync already in crontab. Updating..."
        crontab -l 2>/dev/null | grep -v "sync-todoist-to-obsidian" | crontab -
    fi
    
    # Add to crontab (every 10 minutes)
    (crontab -l 2>/dev/null; echo "*/10 * * * * cd /home/desktop/clawd && ./scripts/sync-todoist-to-obsidian.sh >> logs/todoist-sync.log 2>&1") | crontab -
    
    echo -e "${GREEN}✅ Added to crontab (runs every 10 minutes)${NC}"
    echo ""
    echo "Current crontab:"
    crontab -l | grep todoist || true
    exit 0
fi

if [[ "${1:-}" == "--help" ]]; then
    cat << EOF
Todoist → Obsidian One-Way Sync

Usage:
  $0                    Run sync (imports from Todoist, deletes after)
  $0 --dry-run          Preview what would be synced
  $0 --setup-cron       Add to crontab (runs every 10 min)
  $0 --help             Show this help

Environment:
  TODOIST_API_TOKEN     Your Todoist API token
  VAULT_PATH            Path to Obsidian vault (default: /home/desktop/obsidian-second-brain)

Flow:
  1. Capture task in Todoist (mobile app)
  2. This script runs every 10 minutes
  3. Task is imported to Obsidian 00-Inbox/ or 04-Tasks/
  4. Task is deleted from Todoist
  5. Task is now in Obsidian for processing

From Obsidian, you can:
  - Process into projects/areas
  - Sync to ClickUp (via clickup-agent)
  - Complete in Obsidian

EOF
    exit 0
fi

# Load token from environment or .env
if [[ -z "${TODOIST_API_TOKEN:-}" ]]; then
    if [[ -f "${VAULT_PATH}/.env" ]]; then
        source "${VAULT_PATH}/.env"
    fi
fi

if [[ -z "${TODOIST_API_TOKEN:-}" ]]; then
    echo -e "${RED}ERROR: TODOIST_API_TOKEN not set${NC}"
    echo "Get your token from: https://todoist.com/app/settings/integrations"
    echo "Then: export TODOIST_API_TOKEN=your_token"
    exit 1
fi

# Ensure directories exist
mkdir -p "$INBOX_DIR"
mkdir -p "$TASKS_DIR"

echo "🔄 Todoist → Obsidian Sync"
echo "=========================="
echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
echo "Vault: $VAULT_PATH"
echo ""

# Fetch tasks from Todoist
echo "📱 Fetching tasks from Todoist..."
response=$(curl -s -w "\n%{http_code}" -X GET \
    "$TODOIST_API/tasks" \
    -H "Authorization: Bearer $TODOIST_API_TOKEN" 2>/dev/null) || {
    echo -e "${YELLOW}⚠️  Todoist API unavailable, skipping sync${NC}"
    exit 0
}

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [[ "$http_code" != "200" ]]; then
    echo -e "${YELLOW}⚠️  Todoist API error (HTTP $http_code), skipping sync${NC}"
    exit 0
fi

# Count tasks
task_count=$(echo "$body" | jq 'length')
if [[ "$task_count" == "0" ]] || [[ -z "$task_count" ]]; then
    echo -e "${GREEN}✅ No tasks to import from Todoist${NC}"
    exit 0
fi

echo "Found $task_count task(s) in Todoist"
echo ""

# Process tasks
imported=0
skipped=0

sanitize_filename() {
    local title="$1"
    echo "$title" | \
        tr '[:upper:]' '[:lower:]' | \
        sed 's/[^a-z0-9 _-]//g' | \
        sed 's/  */ /g' | \
        sed 's/ /-/g' | \
        sed 's/--*/-/g' | \
        sed 's/^-//' | \
        sed 's/-$//' | \
        head -c 60
}

check_duplicate() {
    local todoist_id="$1"
    if grep -rq "todoist_id: $todoist_id" "$INBOX_DIR"/*.md 2>/dev/null; then
        return 0
    fi
    if grep -rq "todoist_id: $todoist_id" "$TASKS_DIR"/*.md 2>/dev/null; then
        return 0
    fi
    return 1
}

echo "$body" | jq -c '.[]' | while read -r task; do
    todoist_id=$(echo "$task" | jq -r '.id')
    title=$(echo "$task" | jq -r '.content')
    description=$(echo "$task" | jq -r '.description // ""')
    due_date=$(echo "$task" | jq -r '.due.date // ""')
    priority=$(echo "$task" | jq -r '.priority // 1')
    
    echo "Processing: $title"
    
    # Check for duplicates
    if check_duplicate "$todoist_id"; then
        echo "  ⏭️  Already imported, skipping"
        ((skipped++))
        continue
    fi
    
    # Create filename
    filename=$(sanitize_filename "$title")
    [[ -z "$filename" ]] && filename="task-$todoist_id"
    
    # Check for filename collision
    counter=1
    filepath="$INBOX_DIR/$filename.md"
    while [[ -f "$filepath" ]]; do
        filepath="$INBOX_DIR/$filename-$counter.md"
        counter=$((counter + 1))
    done
    
    # Map priority (Todoist: 1=normal, 4=urgent → Obsidian: normal/high/urgent)
    obsidian_priority="normal"
    if [[ "$priority" == "4" ]]; then
        obsidian_priority="urgent"
    elif [[ "$priority" == "3" ]]; then
        obsidian_priority="high"
    fi
    
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    if [[ "$DRY_RUN" == "true" ]]; then
        echo "  ${YELLOW}[DRY RUN] Would import to: $filepath${NC}"
        ((imported++))
        continue
    fi
    
    # Write task file
    cat > "$filepath" << EOF
---
status: inbox
tags:
  - inbox
  - todoist-import
priority: $obsidian_priority
due: ${due_date}
dateCreated: $timestamp
dateModified: $timestamp
todoist_id: $todoist_id
source: todoist
---

# $title

$description

## Next Actions
- [ ] Process this task (move to appropriate project/area)

---
*Imported from Todoist on $(date '+%Y-%m-%d %H:%M')*
EOF

    echo "  ${GREEN}✅ Imported to Inbox${NC}"
    
    # Delete from Todoist
    delete_response=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE \
        "$TODOIST_API/tasks/$todoist_id" \
        -H "Authorization: Bearer $TODOIST_API_TOKEN" 2>/dev/null) || true
    
    if [[ "$delete_response" == "204" ]] || [[ "$delete_response" == "200" ]]; then
        echo "  ${GREEN}✅ Deleted from Todoist${NC}"
    else
        echo "  ${YELLOW}⚠️  Could not delete from Todoist (HTTP $delete_response)${NC}"
    fi
    
    ((imported++))
    echo ""
done

echo "=========================="
echo -e "${GREEN}Sync complete${NC}"
echo "  Imported: $imported"
echo "  Skipped: $skipped"
echo "=========================="

exit 0
