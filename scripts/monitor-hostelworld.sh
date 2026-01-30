#!/bin/bash

# Hostelworld Krabi Hostels Monitor
# Runs daily at 9:00 AM Thailand time (UTC+7)

# Configuration
LOG_DIR="/home/desktop/clawd/logs/hostelworld"
LOG_FILE="$LOG_DIR/hostelworld-$(date +%Y-%m-%d).log"
SCRIPT_DIR="/home/desktop/clawd/scripts"
TARGET_HOSTELS=("Nomads Ao Nang" "Base Ao Nang Beachfront")
# Telegram target: Replace with your actual Telegram chat ID or username
# Get your chat ID by messaging @userinfobot on Telegram
TELEGRAM_TARGET="${TELEGRAM_TARGET:-@trevordixon}"  # Default: use Telegram username

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Logging function
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Starting Hostelworld monitoring..."

# Calculate dates (search for next weekend to ensure availability)
# Find next Saturday
SATURDAY=$(date -u -d "next saturday" +"%Y-%m-%d")
SUNDAY=$(date -u -d "next sunday" +"%Y-%m-%d")

log "Search dates: $SATURDAY to $SUNDAY"

# Navigate to Hostelworld
log "Opening Hostelworld..."
agent-browser open "https://www.hostelworld.com/pwa/s?q=Krabi,%20Thailand&country=Thailand&city=Krabi&type=city&id=1124&from=$SATURDAY&to=$SUNDAY&guests=1&page=1" >> "$LOG_FILE" 2>&1

if [ $? -ne 0 ]; then
  log "ERROR: Failed to open Hostelworld"
  exit 1
fi

# Wait for page to load
log "Waiting for page load..."
sleep 3

# Change currency to THB
log "Changing currency to THB..."
agent-browser snapshot -i > /dev/null 2>&1
agent-browser click @e7 >> "$LOG_FILE" 2>&1
sleep 1
# Take new snapshot after currency picker opens
agent-browser snapshot -i > /dev/null 2>&1
agent-browser click @e188 >> "$LOG_FILE" 2>&1
sleep 3

# Extract hostel data
log "Extracting hostel data..."
DATA=$(agent-browser eval "$(cat $SCRIPT_DIR/extract-hostels-v3.js)" --json 2>&1)

if [ $? -ne 0 ]; then
  log "ERROR: Failed to extract data"
  agent-browser close >> "$LOG_FILE" 2>&1
  exit 1
fi

# Parse JSON data
echo "$DATA" > "$LOG_DIR/extracted-data.json"
log "Data saved to $LOG_DIR/extracted-data.json"

# Extract relevant fields using jq
TOTAL_HOSTELS=$(echo "$DATA" | jq -r '.data.result.totalHostels // 0')
AVERAGE_PRICE=$(echo "$DATA" | jq -r '.data.result.averagePrice // 0')
MIN_PRICE=$(echo "$DATA" | jq -r '.data.result.minPrice // 0')
MAX_PRICE=$(echo "$DATA" | jq -r '.data.result.maxPrice // 0')

# Get top 5
TOP5=$(echo "$DATA" | jq -r '.data.result.top5[] | "\(.rank). \(.name) - THB \(.price) (Rating: \(.rating))"')

# Get target hostels
NOMADS_RANK=$(echo "$DATA" | jq -r '.data.result.nomads.rank // "N/A"')
NOMADS_PRICE=$(echo "$DATA" | jq -r '.data.result.nomads.price // "N/A"')
NOMADS_RATING=$(echo "$DATA" | jq -r '.data.result.nomads.rating // "N/A"')
NOMADS_VS_AVG=$(echo "$DATA" | jq -r '.data.result.nomads.vsAverage // 0')

BASE_RANK=$(echo "$DATA" | jq -r '.data.result.base.rank // "N/A"')
BASE_PRICE=$(echo "$DATA" | jq -r '.data.result.base.price // "N/A"')
BASE_RATING=$(echo "$DATA" | jq -r '.data.result.base.rating // "N/A"')
BASE_VS_AVG=$(echo "$DATA" | jq -r '.data.result.base.vsAverage // 0')

# Close browser
log "Closing browser..."
agent-browser close >> "$LOG_FILE" 2>&1

# Build message
MESSAGE="🏨 *Hostelworld Krabi Report*
📅 Search: $SATURDAY to $SUNDAY
📅 Report: $(date +%Y-%m-%d)

*Top 5 Hostels (as shown on Hostelworld):*
$TOP5

*Target Hostels:*

🥇 *Nomads Ao Nang Beach*
   • Rank: #$NOMADS_RANK
   • Price: THB $NOMADS_PRICE
   • Rating: $NOMADS_RATING/10
   • vs Avg: THB $NOMADS_VS_AVG

🥈 *Base Ao Nang Beachfront*
   • Rank: #$BASE_RANK
   • Price: THB $BASE_PRICE
   • Rating: $BASE_RATING/10
   • vs Avg: THB $BASE_VS_AVG

*Market Stats:*
• Total Hostels: $TOTAL_HOSTELS
• Average Price: THB $AVERAGE_PRICE
• Price Range: THB $MIN_PRICE - $MAX_PRICE

_Updated: $(date '+%Y-%m-%d %H:%M:%S UTC')_"

log "Message prepared"
log "Total hostels: $TOTAL_HOSTELS"
log "Nomads: Rank #$NOMADS_RANK, THB $NOMADS_PRICE"
log "Base: Rank #$BASE_RANK, THB $BASE_PRICE"

# Save message to file
MESSAGE_FILE="$LOG_DIR/message.txt"
echo "$MESSAGE" > "$MESSAGE_FILE"
log "Message saved to $MESSAGE_FILE"

# Output message to stdout for agent to send
echo ""
echo "=== MESSAGE TO SEND ==="
echo "$MESSAGE"
echo "======================="

log "✓ Monitoring complete"
