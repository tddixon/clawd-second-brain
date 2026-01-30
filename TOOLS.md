# TOOLS.md - Local Notes

Skills define *how* tools work. This file is for *your* specifics — the stuff that's unique to your setup.

---

## Trevor's Tool Stack

### Knowledge & Notes
- **Obsidian** — Second brain / knowledge base

### Task & Project Management
- **Todoist** — Personal task management
- **ClickUp** — Project management (team/business)
  - **REST API Skill:** `/home/desktop/clawd/skills/clickup/` — Direct API calls
  - **MCP Skill:** `/home/desktop/clawd/skills/clickup-mcp/` — Official MCP integration
  - **Agent System:** `/home/desktop/clawd/scripts/clickup-agent.ts` — Automated task execution

### Communication & Calendar
- **Gmail** — Email
- **Google Calendar** — Scheduling

---

## Integration Notes

**Obsidian Second Brain is now the PRIMARY system for all PKM operations.**

Vault path: `/home/desktop/obsidian-second-brain`

This vault replaces:
- Todoist → TaskNotes (task management)
- Scattered notes → Structured PKM
- Ad-hoc planning → GTD workflows

---

## Obsidian Second Brain

**Vault:** `/home/desktop/obsidian-second-brain`  
**TaskNotes API:** `http://127.0.0.1:8090/api` (optional - requires Obsidian running)  
**TaskNotes Skill:** File-based operations following tasknotes.dev spec (no API needed)  
**Auth:** None

**System:** GTD + PARA + TaskNotes + Zettelkasten

**Skills location:** `/home/desktop/obsidian-second-brain/.skills/second-brain/`

### Core Workflows

| Command | Workflow | File |
|---------|----------|------|
| "capture this" | Quick task/note capture | `workflows/capture.md` |
| "process inbox" | GTD clarify + organize | `workflows/process-inbox.md` |
| "plan my day" | Daily planning (Top 3 selection) | `workflows/daily-plan.md` |
| "close out day" | Evening review + tomorrow prep | `workflows/daily-closeout.md` |
| "start timer" / "stop timer" | Time tracking | `workflows/track-time.md` |
| "what did I work on [date]" | Historical work query | `workflows/work-history.md` |

### Key Conventions

- **DEEP WIKI-LINKING (TOP PRIORITY)** - Everything must interconnect via WikiLinks:
  - Tasks → projects/areas
  - Projects → parent area + all notes
  - Areas → all projects
  - Notes → 3+ related items
  - Daily plans → inline project links
  - Sub-projects → ALWAYS update parent summary to list them
  - No orphans allowed!
- **Tasks must have concrete actions** - Reject "think about", require "Call John at 555-1234"
- **Wikilink format for projects** - `["[[Project Name]]"]` not plain text
- **Health check API first** - Verify TaskNotes before operations
- **Fallback to files** - Direct writes to `Tasks/` if API unavailable
- **Source tags for sync** - `#source/projects/filename` enables closeout sync-back

### Folder Structure

```
00-Inbox/          # <5 items required before daily planning
01-Daily-Notes/    # Daily plans with source tags
02-Projects/       # Active projects (Folder-Notes compatible)
03-Areas/          # Ongoing responsibilities
04-Tasks/          # TaskNotes task files (API-managed)
Resources/         # Reference materials
Archives/          # Completed projects
```

### TaskNotes API Quick Reference

```bash
# Health check (ALWAYS RUN FIRST)
curl -s http://127.0.0.1:8090/api/tasks | head -1

# Create task
curl -X POST "http://127.0.0.1:8090/api/tasks" \
  -H "Content-Type: application/json" \
  -d '{"title": "Task", "status": "open", "priority": "normal", "tags": ["task"]}'

# Query open tasks
curl -s "http://127.0.0.1:8090/api/tasks?status=open"

# Start timer
curl -X POST "http://127.0.0.1:8090/api/tasks/{path}/time/start"
```

**If API unavailable:** Use fallback workflows in `workflows/clawdbot-capture.md` and `workflows/clawdbot-query.md`

---

## Gemini CLI (OAuth Authenticated)

**Account:** trevord.dixon@gmail.com  
**Auth method:** OAuth (GOOGLE_GENAI_USE_GCA=true)

**When to use:**
- Research queries (web search, fact-checking, general knowledge)
- Quick calculations and conversions
- Token preservation (offload simple queries from Claude)
- Text summaries and condensing

**Usage:** `gemini "prompt here"`

---

## Token Optimization Strategy

**See:** `/home/desktop/clawd/TOKEN-OPTIMIZATION.md` for detailed routing rules.

**Quick Reference:**
- **Heavy coding** → Claude Code wingman (uses work API, auto-picks Opus/Sonnet)
- **Research/facts** → Gemini CLI (free, fast)
- **External research** → Sub-agents with cheap models
- **Conversations** → Claude Sonnet (main session)

**Always route appropriately to minimize costs while maintaining quality.**

---

---

## ClickUp Integration

**Installed Skills:**
1. **clickup** — REST API skill (direct API calls)
2. **clickup-mcp** — Official ClickUp MCP (OAuth-based)

### Configuration

Add to `~/.bashrc` or `~/.clawdsync/clickup-agent-config`:
```bash
# REST API (for scripts/agent)
export CLICKUP_API_KEY="pk_your_token_here"
export CLICKUP_TEAM_ID="your_team_id"
export CLAWD_CLICKUP_USER_ID="clawd_user_id"
export CLAWD_TREVOR_USER_ID="trevor_user_id"

# MCP OAuth (optional, for advanced features)
export CLICKUP_TOKEN="eyJhbGciOiJkaXIi..."  # From Claude Code OAuth
```

### Getting Credentials

**API Token:**
1. Go to https://app.clickup.com/settings/apps
2. Click "Generate" under API Token
3. Copy the token

**Team ID:**
```bash
cd /home/desktop/clawd
./scripts/clickup-agent.sh --setup
# Or manually:
curl -H "Authorization: pk_your_token" https://api.clickup.com/api/v2/team
```

**User IDs:**
```bash
# Get all team members
curl -H "Authorization: pk_your_token" https://api.clickup.com/api/v2/team/{team_id}
```

### MCP Setup (Optional - Advanced Features)

For 32+ tools including docs, chat, time tracking:

**Via Claude Code (Recommended):**
```bash
# In Claude Code
claude mcp add clickup --transport http https://mcp.clickup.com/mcp
# Then run: /mcp
# Complete OAuth in browser

# Extract token for mcporter
jq -r '.mcpOAuth | to_entries | .[] | select(.key | startswith("clickup")) | .value.accessToken' ~/.claude/.credentials.json
```

**Then add to environment:**
```bash
export CLICKUP_TOKEN="extracted_token"
```

### Usage

**REST API (Most Common):**
```bash
# Query tasks
./scripts/clickup-query.sh tasks

# Get task counts
./scripts/clickup-query.sh task-count

# Agent automation
./scripts/clickup-agent.sh --run-now
```

**MCP (Advanced):**
```bash
# Search everything
mcporter call 'clickup.clickup_search(keywords: "marketing")'

# Create task
mcporter call 'clickup.clickup_create_task(name: "New Task", list_id: "...")'

# Start timer
mcporter call 'clickup.clickup_start_time_tracking(task_id: "...")'
```

### Automation (Agent)

The ClickUp agent runs automatically:
```bash
# Every 5 minutes via cron
*/5 * * * * ./scripts/clickup-agent.sh --run-now

# What it does:
# 1. Syncs new folders → Obsidian Areas
# 2. Syncs new lists → Obsidian Projects
# 3. Executes tasks assigned to Clawd
# 4. Assists Trevor with his tasks
```

### Documentation

- **Agent System:** `Resources/ClickUp-Clawd-Agent.md`
- **2-Way Sync:** `Resources/ClickUp-Obsidian-Sync.md`
- **REST API Skill:** `/home/desktop/clawd/skills/clickup/SKILL.md`
- **MCP Skill:** `/home/desktop/clawd/skills/clickup-mcp/SKILL.md`

---

## Environment-Specific

*(Add as needed: camera names, SSH hosts, TTS voices, device nicknames, etc.)*
