# TOOLS.md - Local Notes

Skills define *how* tools work. This file is for *your* specifics — the stuff that's unique to your setup.

---

## Trevor's Tool Stack

### Knowledge & Notes
- **Obsidian** — Second brain / knowledge base

### Task & Project Management
- **Todoist** — Personal task management
- **ClickUp** — Project management (team/business?)

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

## Environment-Specific

*(Add as needed: camera names, SSH hosts, TTS voices, device nicknames, etc.)*
