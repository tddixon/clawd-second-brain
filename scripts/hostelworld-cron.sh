#!/bin/bash

##############################################################################
# Hostelworld Daily Price Monitor - Cron Wrapper
# 
# Runs the Hostelworld price monitor and sends results to Trevor via Telegram
# Scheduled to run daily at 6:00 AM Thailand time
##############################################################################

# Configuration
SCRIPT_DIR="/home/desktop/clawd/scripts"
LOG_DIR="/home/desktop/clawd/logs/hostelworld"
MONITOR_SCRIPT="$SCRIPT_DIR/hostelworld-price-monitor.js"
REPORT_FILE="$LOG_DIR/$(date +%Y-%m-%d)-report.txt"
ERROR_LOG="$LOG_DIR/error.log"
MAX_RETRIES=3

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Logging function
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Error handler
handle_error() {
  local error_msg="$1"
  log "ERROR: $error_msg"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $error_msg" >> "$ERROR_LOG"
  
  # Send error notification to Trevor
  clawdbot message send --target "@trevordixon" \
    --message "🚨 Hostelworld Monitor Error

$error_msg

Time: $(date '+%Y-%m-%d %H:%M:%S')
Check logs: $ERROR_LOG" 2>&1 | logger -t hostelworld-cron
}

# Main execution
log "========================================="
log "Starting Hostelworld Price Monitor"
log "========================================="

# Run the price monitor with retries
retry_count=0
success=false

while [ $retry_count -lt $MAX_RETRIES ] && [ "$success" = false ]; do
  if [ $retry_count -gt 0 ]; then
    log "Retry attempt $retry_count of $MAX_RETRIES"
    sleep 30  # Wait 30 seconds before retry
  fi
  
  # Run the monitor script
  if node "$MONITOR_SCRIPT" --today; then
    success=true
    log "✓ Price monitor completed successfully"
  else
    retry_count=$((retry_count + 1))
    log "✗ Price monitor failed (attempt $retry_count)"
  fi
done

# Check if we succeeded
if [ "$success" = false ]; then
  handle_error "Failed to run price monitor after $MAX_RETRIES attempts"
  exit 1
fi

# Read the report
if [ ! -f "$REPORT_FILE" ]; then
  handle_error "Report file not found: $REPORT_FILE"
  exit 1
fi

REPORT=$(cat "$REPORT_FILE")

if [ -z "$REPORT" ]; then
  handle_error "Report is empty"
  exit 1
fi

# Send via Telegram
log "Sending report to Trevor..."

if clawdbot message send --target "@trevordixon" --message "$REPORT" 2>&1 | logger -t hostelworld-cron; then
  log "✓ Report sent successfully"
else
  handle_error "Failed to send report via Telegram"
  exit 1
fi

log "========================================="
log "Hostelworld Monitor Complete"
log "========================================="

exit 0
