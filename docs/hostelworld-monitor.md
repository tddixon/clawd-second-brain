# Hostelworld Krabi Monitor

**Daily automated monitoring of Hostelworld hostel prices in Krabi, Thailand**

## Overview

This system monitors Hostelworld search results for Krabi hostels and sends daily reports via Telegram. It tracks:
- Top 5 hostels by price (cheapest first)
- Position and price of "Nomads Ao Nang Beach" and "Base Ao Nang Beachfront"
- Price comparisons against market average
- Market statistics

## Components

### 1. Monitoring Script
**Location:** `/home/desktop/clawd/scripts/monitor-hostelworld.sh`

Main shell script that:
- Opens Hostelworld with dynamic dates (next Saturday to Sunday)
- Changes currency to THB (Thai Baht)
- Extracts hostel data using agent-browser
- Generates a formatted report
- Saves output to log files

**Dependencies:**
- `agent-browser` (npm package, installed globally)
- `jq` (JSON processor)

### 2. Data Extraction Script
**Location:** `/home/desktop/clawd/scripts/extract-hostels-v3.js`

JavaScript that runs in the browser context to:
- Parse hostel listings from the page
- Extract names, prices, ratings
- Deduplicate results
- Rank hostels by price
- Calculate market statistics

### 3. Cron Job
**ID:** `9ec19c13-ed9d-49ed-a748-ecb5f97f3f95`
**Name:** `hostelworld-krabi-monitor`

Scheduled to run daily at:
- **9:00 AM Thailand time (UTC+7)**
- **2:00 AM UTC**

Uses:
- **Model:** GLM 4.7 (`zai/glm-4.7`) for cost efficiency
- **Thinking level:** Low
- **Session:** Isolated
- **Delivery:** Telegram to @trevordixon

## Logs & Output

### Log Directory
```
/home/desktop/clawd/logs/hostelworld/
```

### Log Files
- `hostelworld-YYYY-MM-DD.log` - Daily execution logs
- `message.txt` - Last generated message
- `extracted-data.json` - Raw hostel data (JSON)

### Log Contents
Each log includes:
- Timestamp for each step
- Search dates used
- Total hostels found
- Target hostel rankings and prices
- Success/failure status

## Manual Testing

### Run the monitoring script manually:
```bash
cd /home/desktop/clawd
./scripts/monitor-hostelworld.sh
```

### Check recent logs:
```bash
tail -f /home/desktop/clawd/logs/hostelworld/hostelworld-$(date +%Y-%m-%d).log
```

### View last report:
```bash
cat /home/desktop/clawd/logs/hostelworld/message.txt
```

### View extracted data:
```bash
cat /home/desktop/clawd/logs/hostelworld/extracted-data.json | jq '.'
```

## Cron Job Management

### List all cron jobs:
```bash
clawdbot cron list
```

### View cron status:
```bash
clawdbot cron status
```

### View run history:
```bash
clawdbot cron runs hostelworld-krabi-monitor
```

### Disable the job:
```bash
clawdbot cron disable 9ec19c13-ed9d-49ed-a748-ecb5f97f3f95
```

### Enable the job:
```bash
clawdbot cron enable 9ec19c13-ed9d-49ed-a748-ecb5f97f3f95
```

### Remove the job:
```bash
clawdbot cron rm 9ec19c13-ed9d-49ed-a748-ecb5f97f3f95
```

## Configuration

### Telegram Target
The default Telegram target is `@trevordixon`. To change it:

1. **For manual runs:** Set environment variable:
   ```bash
   TELEGRAM_TARGET="@yournewusername" ./scripts/monitor-hostelworld.sh
   ```

2. **For cron job:** Edit the cron job:
   ```bash
   clawdbot cron edit 9ec19c13-ed9d-49ed-a748-ecb5f97f3f95 --to "@yournewusername"
   ```

To find your Telegram chat ID:
- Message `@userinfobot` on Telegram
- Use the chat ID instead of username (more reliable)

### Search Dates
The script automatically searches for next weekend (Saturday to Sunday) to ensure availability. This can be changed in the script:

Edit `/home/desktop/clawd/scripts/monitor-hostelworld.sh`:
```bash
# Current: Next weekend
SATURDAY=$(date -u -d "next saturday" +"%Y-%m-%d")
SUNDAY=$(date -u -d "next sunday" +"%Y-%m-%d")

# Alternative: Today + tomorrow
TODAY=$(date -u +"%Y-%m-%d")
TOMORROW=$(date -u -d "+1 day" +"%Y-%m-%d")
```

### Target Hostels
To monitor different hostels, edit the extraction script:
`/home/desktop/clawd/scripts/extract-hostels-v3.js`

Change line:
```javascript
const targetHostels = ['Nomads Ao Nang', 'Base Ao Nang Beachfront'];
```

## Report Format

### Sample Report:
```
🏨 *Hostelworld Krabi Report*
📅 Search: 2026-01-31 to 2026-02-01
📅 Report: 2026-01-27

*Top 5 Hostels (by price):*
1. The Guest Hotel - THB 345 (Rating: 8.7)
2. Leisure Hostel - THB 396 (Rating: 8.8)
3. The Bananas Off the beaten track Hostel - THB 415 (Rating: 9.9)
4. Hogwortz hostel tour - THB 430 (Rating: 8.5)
5. Let s Sea Hostel - THB 604 (Rating: 9.7)

*Target Hostels:*

🥇 *Nomads Ao Nang Beach*
   • Rank: #26
   • Price: THB 1260
   • Rating: 9.6/10
   • vs Avg: THB 344

🥈 *Base Ao Nang Beachfront*
   • Rank: #23
   • Price: THB 1215
   • Rating: 9.5/10
   • vs Avg: THB 299

*Market Stats:*
• Total Hostels: 30
• Average Price: THB 916
• Price Range: THB 345 - 1978

_Updated: 2026-01-27 17:51:10 UTC_
```

## Troubleshooting

### No hostels found (totalHostels: 0)
**Cause:** The search dates might not have available properties
**Solution:** The script automatically searches for next weekend. If that fails, there might be no listings for those dates.

### agent-browser not found
**Cause:** agent-browser not installed
**Solution:** 
```bash
npm install -g agent-browser
agent-browser install
```

### Currency not changing to THB
**Cause:** Element references change after page interactions
**Solution:** Script takes snapshots between clicks. This should work automatically.

### Message not sent
**Cause:** Invalid Telegram target or gateway not running
**Solution:**
1. Check gateway: `clawdbot gateway status`
2. Verify target: Use chat ID instead of username
3. Check logs: `/home/desktop/clawd/logs/hostelworld/hostelworld-YYYY-MM-DD.log`

### Cron job not running
**Cause:** Various scheduling issues
**Solution:**
1. Check job status: `clawdbot cron list`
2. Verify enabled: `enabled: true`
3. Check next run time: `nextRunAtMs` field
4. View run history: `clawdbot cron runs hostelworld-krabi-monitor`

## Technical Details

### Browser Automation
- Uses Playwright via agent-browser CLI
- Headless mode (no visible browser window)
- Automatic cookie/session management
- JavaScript execution for data extraction

### Currency Handling
The script:
1. Opens Hostelworld in USD
2. Clicks the currency selector
3. Waits for currency picker to appear
4. Takes a new snapshot to get fresh element references
5. Selects THB (Thai Baht)
6. Waits for page to reload with THB prices

### Data Extraction
The JavaScript extracts:
- Hostel names from link text
- Prices (after discounts) in THB
- Ratings (Superb, Very Good, etc.)
- Ranks hostels by price (cheapest first)
- Calculates averages and price ranges

### Cost Efficiency
- **Model:** GLM 4.7 (`zai/glm-4.7`) - Cost-effective model
- **Thinking:** Low - Minimal reasoning needed
- **Execution:** ~10-15 seconds per run
- **Token usage:** Minimal - mostly tool calls

## Future Improvements

Potential enhancements:
- [ ] Add price trend tracking (compare to previous days)
- [ ] Send alerts when prices drop below threshold
- [ ] Track availability changes
- [ ] Add more target hostels
- [ ] Support multiple destinations
- [ ] Add charts/graphs for price trends
- [ ] Email delivery option
- [ ] Weekly summary reports

## Support

For issues or questions:
- Check logs first: `/home/desktop/clawd/logs/hostelworld/`
- Review this documentation
- Test manually: `./scripts/monitor-hostelworld.sh`
- Check cron history: `clawdbot cron runs hostelworld-krabi-monitor`

## Files Summary

```
/home/desktop/clawd/
├── scripts/
│   ├── monitor-hostelworld.sh          # Main monitoring script
│   ├── extract-hostels-v3.js           # Data extraction JavaScript
│   ├── extract-hostels.js              # (old version)
│   ├── extract-hostels-v2.js           # (old version)
│   ├── extract-hostels-final.js        # (old version)
│   └── debug-*.js                      # Debug scripts
├── logs/
│   └── hostelworld/
│       ├── hostelworld-YYYY-MM-DD.log  # Daily logs
│       ├── message.txt                  # Last message
│       └── extracted-data.json         # Last data
└── docs/
    └── hostelworld-monitor.md          # This file
```

## License & Credits

Created: 2026-01-27
Author: Clawdbot Subagent
Technology: agent-browser, Playwright, Clawdbot Cron
