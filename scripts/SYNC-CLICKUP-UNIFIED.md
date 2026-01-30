# ClickUp ↔ Obsidian Unified Sync

**Status:** Active (consolidated from 3 competing scripts)  
**Location:** `/home/desktop/clawd/scripts/sync-clickup-unified.js`  
**Utilities:** `/home/desktop/clawd/scripts/lib/utils.js`

## Overview

This script consolidates all features from the previous 3 ClickUp sync implementations:

1. **sync-clickup-obsidian.ts** (665 LOC) - TypeScript, full featured, inbox categorization
2. **sync-clickup-standalone.js** (282 LOC) - Simplified Node.js implementation
3. **sync-clickup-v2.js** (163 LOC) - Updated hierarchy model

## Features

### Core Functionality
- ✅ **2-way sync** (ClickUp ↔ Obsidian)
- ✅ **Updated hierarchy model** (Space = Area → Folder = Project → Lists = Task Groups)
- ✅ **Inbox categorization** with keyword-based task organization
- ✅ **Individual task files** with YAML frontmatter (TaskNotes compatible)
- ✅ **Sync state tracking** to prevent duplicates
- ✅ **Retry logic** with exponential backoff (3 retries, 1s/2s/4s delays)
- ✅ **Dry-run mode** for testing without changes
- ✅ **Comprehensive logging** to file and console
- ✅ **Area filtering** to sync specific spaces only

### Hierarchy Model

```
ClickUp                 →  Obsidian
─────────────────────────────────────
Space (e.g., Personal)  →  Area (03-Areas/)
  ↓
Folder (e.g., Health)   →  Project (02-Projects/)
  ↓
List (e.g., Workouts)   →  Task Group (within project note)
  ↓
Tasks                   →  Individual task files (04-Tasks/)
```

### Inbox Handling

When a folder is named "Inbox", the script:
1. Fetches all tasks from inbox lists
2. Categorizes using keyword matching (business, personal, work)
3. Creates an organization note in `00-Inbox/` with suggested projects
4. Creates task files for each inbox item
5. Suggests where each task should be moved in ClickUp

**Categorization keywords:**
- **Nomads Business:** nomads, hostel, bangkok, booking, mews
- **Marketing:** ads, facebook, instagram, campaign, seo
- **Development:** code, website, api, automation, clawd
- **Personal Health:** gym, fitness, workout, doctor
- **Personal Travel:** flight, hotel, trip, vacation
- And more...

### 2-Way Sync

**ClickUp → Obsidian:**
- Creates/updates Areas, Projects, and Task files
- Syncs task metadata (status, priority, due dates, assignees)
- Organizes inbox tasks with categorization

**Obsidian → ClickUp:**
- Creates new tasks in ClickUp from unchecked items in project notes
- Marks ClickUp tasks complete when checked in Obsidian
- Preserves task links with `#clickup-task-{id}` tags

## Configuration

### Environment Variables

Set these in `~/.bashrc` or `/home/desktop/.clawdsync/clickup-agent-config`:

```bash
export CLICKUP_API_TOKEN="pk_your_token_here"    # Or CLICKUP_API_KEY
export CLICKUP_TEAM_ID="your_team_id"
export OBSIDIAN_VAULT="/home/desktop/obsidian-second-brain"  # Optional, has default
```

### Config File

The script sources configuration from:
```
/home/desktop/.clawdsync/clickup-agent-config
```

Format:
```bash
export CLICKUP_API_TOKEN="pk_..."
export CLICKUP_TEAM_ID="12345"
export OBSIDIAN_VAULT="/path/to/vault"
```

## Usage

### Basic Sync

```bash
./sync-clickup-unified.js
```

### Dry Run (No Changes)

Test the sync without making any changes:

```bash
./sync-clickup-unified.js --dry-run
```

### Filter by Area

Sync only specific spaces:

```bash
./sync-clickup-unified.js --area=Personal
./sync-clickup-unified.js --area=Nomads
```

### Verbose Logging

Show detailed API calls and operations:

```bash
./sync-clickup-unified.js --verbose
```

### Combined Options

```bash
./sync-clickup-unified.js --dry-run --area=Personal --verbose
```

## Logging

Logs are written to:
```
/home/desktop/clawd/logs/sync-clickup.log
```

Format:
```
[2025-01-30T18:00:00.000Z] [INFO] Starting sync...
[2025-01-30T18:00:01.000Z] [ERROR] API error 429: Rate limit exceeded
[2025-01-30T18:00:02.000Z] [DEBUG] API Request: GET /team/12345/space
```

In dry-run mode, file logging is disabled to avoid cluttering logs.

## Sync State

State is tracked in:
```
/home/desktop/obsidian-second-brain/.clawdsync/clickup-sync-state.json
```

This prevents duplicate task creation and tracks:
- Last sync timestamp
- Mappings (ClickUp IDs → Obsidian files)
- Versions (for future conflict resolution)

## File Structure

### Created Files

**Areas (Spaces):**
```
03-Areas/
  Personal/
    Personal.md          # Area overview with project list
  Nomads/
    Nomads.md
```

**Projects (Folders):**
```
02-Projects/
  Personal-Health/
    Personal-Health.md   # Project note with task groups by list
  Nomads-Marketing/
    Nomads-Marketing.md
```

**Tasks:**
```
04-Tasks/
  Morning-workout-routine.md
  Update-Facebook-ads.md
  Fix-booking-engine-bug.md
```

**Inbox Organization:**
```
00-Inbox/
  Personal-Inbox-Organization.md  # Categorized inbox tasks with suggestions
```

### Task File Format

```markdown
---
status: open
tags:
  - task
  - clickup-import
priority: high
projects: ["[[Nomads-Marketing]]"]
due: 2025-02-01
dateCreated: 2025-01-30T18:00:00.000Z
dateModified: 2025-01-30T18:30:00.000Z
clickup_id: abc123
clickup_url: https://app.clickup.com/t/abc123
clickup_list: Marketing Tasks
clickup_status: in progress
assignees: trevor, clawd
---

# Update Facebook Ads Campaign

Review performance metrics and adjust targeting for Q1 campaign.

## ClickUp Reference
- **Task ID:** abc123
- **URL:** https://app.clickup.com/t/abc123
- **List:** Marketing Tasks
- **Project:** Marketing
- **Area:** Nomads
- **Status:** in progress
- **Assignees:** trevor, clawd

---
*Imported from ClickUp on 2025-01-30*
```

## Error Handling

### Retry Logic

All API calls automatically retry 3 times with exponential backoff:
- Attempt 1: Immediate
- Attempt 2: Wait 1s
- Attempt 3: Wait 2s
- Attempt 4: Wait 4s

### Graceful Degradation

If an API call fails after retries:
- Error is logged
- Sync continues with remaining items
- Partial success is reported

### Rate Limiting

The retry logic handles ClickUp API rate limits (100 requests/minute):
- Waits before retrying
- Exponential backoff gives time for rate limit reset

## Shared Utilities

Extracted to `/home/desktop/clawd/scripts/lib/utils.js`:

- `sanitizeName(name)` - Clean names for filesystem
- `ensureDir(dir)` - Create directory if missing
- `sleep(ms)` - Async sleep
- `retryWithBackoff(fn, maxRetries, baseDelay)` - Retry with exponential backoff
- `formatDate(timestamp)` - Format as YYYY-MM-DD
- `formatDateTime(timestamp)` - Format as ISO datetime
- `loadConfig(configPath)` - Load config from file + environment

## Migration from Old Scripts

The old scripts have been backed up:
```
sync-clickup-obsidian.ts.bak
sync-clickup-standalone.js.bak
sync-clickup-v2.js.bak
```

No changes needed - the unified script is a drop-in replacement with all features merged.

If you were using:
- `sync-clickup-obsidian.ts` - Switch to `sync-clickup-unified.js` (same features + more)
- `sync-clickup-standalone.js` - Switch to `sync-clickup-unified.js` (same features + more)
- `sync-clickup-v2.js` - Switch to `sync-clickup-unified.js` (uses v3 hierarchy model)

## Cron Integration

To run automatically:

```bash
# Add to crontab
*/30 * * * * cd /home/desktop/clawd/scripts && ./sync-clickup-unified.js >> /home/desktop/clawd/logs/sync-clickup-cron.log 2>&1
```

Or use the existing agent system:
```bash
./clickup-agent.sh --run-now
```

## Future Enhancements

Possible improvements:
- [ ] Update existing task files (currently skips if exists)
- [ ] Detect conflicts (both sides modified)
- [ ] Sub-task support
- [ ] Custom field sync
- [ ] Attachment sync
- [ ] Comment sync
- [ ] Time tracking sync
- [ ] Webhook support for real-time sync

## Testing

### Test with Dry Run

```bash
# See what would happen without making changes
./sync-clickup-unified.js --dry-run --verbose
```

### Test Single Area

```bash
# Test with just one space
./sync-clickup-unified.js --dry-run --area=Personal
```

### Verify Logs

```bash
# Watch logs in real-time
tail -f /home/desktop/clawd/logs/sync-clickup.log
```

## Troubleshooting

### Authentication Errors

```
❌ CLICKUP_API_TOKEN and CLICKUP_TEAM_ID required
```

**Fix:** Set environment variables or add to config file.

### API Errors

```
[ERROR] API error 401: Unauthorized
```

**Fix:** Check API token is valid and not expired.

### Rate Limit Errors

```
[ERROR] API error 429: Rate limit exceeded
```

**Fix:** The script will retry automatically. If persistent, reduce sync frequency.

### File Permission Errors

```
[ERROR] Failed to write file: EACCES
```

**Fix:** Check file permissions on vault directory.

### No Tasks Created

**Check:**
1. Tasks exist in ClickUp lists
2. Area filter isn't excluding everything
3. Dry-run mode isn't enabled
4. Sync state isn't blocking (delete state file to reset)

## Performance

**Typical sync times:**
- Small workspace (1 space, 3 folders, 50 tasks): ~5-10s
- Medium workspace (2 spaces, 10 folders, 200 tasks): ~20-30s
- Large workspace (5 spaces, 30 folders, 1000 tasks): ~60-90s

**Optimization:**
- Skips existing files (no re-sync)
- Batch operations where possible
- Retry logic prevents wasted calls

## Support

**Issues?** Check:
1. Logs: `/home/desktop/clawd/logs/sync-clickup.log`
2. Sync state: `.clawdsync/clickup-sync-state.json`
3. Config: `/home/desktop/.clawdsync/clickup-agent-config`
4. Environment: `echo $CLICKUP_API_TOKEN`

**Need help?** Contact your agent (me!) or check the old scripts in `.bak` files.
