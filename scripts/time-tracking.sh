#!/bin/bash
# Time Tracking Wrapper for ClickUp ↔ Obsidian

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load config
if [ -f "$HOME/.clawdsync/clickup-agent-config" ]; then
    source "$HOME/.clawdsync/clickup-agent-config"
fi

case "${1:-}" in
    start)
        shift
        node "$SCRIPT_DIR/time-tracking.js" start "$@"
        ;;
    stop)
        shift
        node "$SCRIPT_DIR/time-tracking.js" stop "$@"
        ;;
    add)
        shift
        node "$SCRIPT_DIR/time-tracking.js" add "$@"
        ;;
    status)
        node "$SCRIPT_DIR/time-tracking.js" status
        ;;
    sync)
        shift
        node "$SCRIPT_DIR/time-tracking.js" sync "$@"
        ;;
    *)
        cat << EOF
⏱️  Time Tracking for ClickUp ↔ Obsidian

Commands:
  start <task_id> [description]  Start timer on task
  stop [task_id]                 Stop timer (or all active)
  add <task_id> <minutes> [desc] Add manual time entry
  status                         Show active timers
  sync <task_id>                 Sync time entries from ClickUp

Examples:
  ./time-tracking.sh start 123456789 "Working on feature"
  ./time-tracking.sh stop
  ./time-tracking.sh add 123456789 30 "Code review"
  ./time-tracking.sh status

Time is tracked in both ClickUp AND Obsidian task files.
EOF
        ;;
esac
