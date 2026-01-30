#!/bin/bash
# Clawd ClickUp Agent Wrapper

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/home/desktop/clawd/logs/clickup-agent.log"
PID_FILE="/tmp/clickup-agent.pid"

# Load config if exists
if [ -f "$HOME/.clawdsync/clickup-agent-config" ]; then
    source "$HOME/.clawdsync/clickup-agent-config"
fi

# Help
show_help() {
    cat << EOF
🦎 Clawd ClickUp Agent

Commands:
  --run-now       Run agent once immediately
  --start         Start agent daemon (continuous polling)
  --stop          Stop agent daemon
  --status        Show current status and recent activity
  --dry-run       Run once without making changes (test mode)
  --setup         Run initial setup wizard
  --setup-cron    Add to crontab for automatic execution
  --logs          Show recent logs
  --help          Show this help

Environment Variables:
  CLICKUP_API_TOKEN        Your ClickUp API token
  CLICKUP_TEAM_ID          Your ClickUp team ID
  CLAWD_CLICKUP_USER_ID    Clawd's user ID
  CLAWD_TREVOR_USER_ID     Trevor's user ID

Examples:
  ./clickup-agent.sh --run-now          # Process tasks now
  ./clickup-agent.sh --dry-run          # Preview what would happen
  ./clickup-agent.sh --status           # Check agent status
  ./clickup-agent.sh --setup            # First-time setup
EOF
}

# Run once
run_now() {
    echo "🦎 Running Clawd ClickUp Agent..."
    echo "Timestamp: $(date)"
    echo ""
    
    cd "$SCRIPT_DIR/.."
    
    if [ -n "$VERBOSE" ]; then
        npx ts-node scripts/clickup-agent.ts --once "$@" 2>&1 | tee -a "$LOG_FILE"
    else
        npx ts-node scripts/clickup-agent.ts --once "$@" 2>&1 | tee -a "$LOG_FILE"
    fi
    
    echo ""
    echo "✅ Run complete. Log: $LOG_FILE"
}

# Dry run
dry_run() {
    echo "🔍 Dry Run Mode (no changes will be made)"
    echo ""
    run_now --dry-run
}

# Show status
show_status() {
    cd "$SCRIPT_DIR/.."
    npx ts-node scripts/clickup-agent.ts --status
}

# Show logs
show_logs() {
    if [ -f "$LOG_FILE" ]; then
        echo "📝 Recent Agent Logs:"
        echo "===================="
        tail -50 "$LOG_FILE"
    else
        echo "No logs found at: $LOG_FILE"
    fi
}

# Setup wizard
run_setup() {
    "$SCRIPT_DIR/clickup-agent-setup.sh"
}

# Setup cron
setup_cron() {
    echo "Setting up automatic execution..."
    
    # Check if already in crontab
    if crontab -l 2>/dev/null | grep -q "clickup-agent"; then
        echo "⚠️ Agent already in crontab. Updating..."
        crontab -l 2>/dev/null | grep -v "clickup-agent" | crontab -
    fi
    
    # Add to crontab (every 5 minutes)
    (crontab -l 2>/dev/null; echo "*/5 * * * * cd /home/desktop/clawd && ./scripts/clickup-agent.sh --run-now >> logs/clickup-agent-cron.log 2>&1") | crontab -
    
    echo "✅ Added to crontab (runs every 5 minutes)"
    echo ""
    echo "Current crontab:"
    crontab -l | grep clickup-agent
}

# Parse arguments
case "${1:-}" in
    --run-now)
        shift
        run_now "$@"
        ;;
    --dry-run)
        dry_run
        ;;
    --status)
        show_status
        ;;
    --logs)
        show_logs
        ;;
    --setup)
        run_setup
        ;;
    --setup-cron)
        setup_cron
        ;;
    --help|-h)
        show_help
        ;;
    "")
        echo "No command specified. Use --help for usage."
        exit 1
        ;;
    *)
        echo "Unknown command: $1"
        echo "Use --help for usage"
        exit 1
        ;;
esac
