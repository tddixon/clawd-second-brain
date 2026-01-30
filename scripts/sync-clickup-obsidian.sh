#!/bin/bash
# ClickUp ↔ Obsidian 2-Way Sync Wrapper

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VAULT_DIR="/home/desktop/obsidian-second-brain"
LOG_FILE="$SCRIPT_DIR/../logs/clickup-sync.log"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Check environment variables
if [ -z "$CLICKUP_API_TOKEN" ]; then
    echo "❌ CLICKUP_API_TOKEN not set"
    echo "Get your token from: https://app.clickup.com/settings/apps"
    exit 1
fi

if [ -z "$CLICKUP_TEAM_ID" ]; then
    echo "❌ CLICKUP_TEAM_ID not set"
    echo "Run: cd /home/desktop/clawd && ts-node discover-clickup.ts"
    exit 1
fi

# Parse arguments
DRY_RUN=""
AREA=""
VERBOSE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN="--dry-run"
            shift
            ;;
        --area=*)
            AREA="$1"
            shift
            ;;
        --verbose)
            VERBOSE="true"
            shift
            ;;
        --help)
            echo "Usage: sync-clickup-obsidian.sh [options]"
            echo ""
            echo "Options:"
            echo "  --dry-run       Show what would change without making changes"
            echo "  --area=NAME     Sync only specific area/folder"
            echo "  --verbose       Show detailed output"
            echo "  --help          Show this help"
            echo ""
            echo "Environment:"
            echo "  CLICKUP_API_TOKEN    Your ClickUp API token"
            echo "  CLICKUP_TEAM_ID      Your ClickUp team ID"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage"
            exit 1
            ;;
    esac
done

echo "🔄 Starting ClickUp ↔ Obsidian sync..."
echo "Timestamp: $(date)"
echo ""

# Run sync
cd "$SCRIPT_DIR"
if [ "$VERBOSE" = "true" ]; then
    ts-node sync-clickup-obsidian.ts $DRY_RUN $AREA 2>&1 | tee -a "$LOG_FILE"
else
    ts-node sync-clickup-obsidian.ts $DRY_RUN $AREA 2>&1 | tee -a "$LOG_FILE"
fi

echo ""
echo "✅ Sync complete!"
echo "Log: $LOG_FILE"
