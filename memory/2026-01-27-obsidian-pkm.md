# 2026-01-27 - Obsidian PKM System Learned

**Vault Path:** `/home/desktop/obsidian-second-brain`

Today Trevor asked me to learn the new PKM (Personal Knowledge Management) system in the Obsidian vault. This is now our **source of truth** for all tasks, projects, notes, and planning.

## System Overview

**Second Brain** = GTD + PARA + TaskNotes + Zettelkasten

- **GTD (Getting Things Done):** 5-stage workflow - Capture, Clarify, Organize, Reflect, Engage
- **PARA:** Projects / Areas / Resources / Archives folder structure
- **TaskNotes:** Single source of truth for tasks (HTTP API on port 8090)
- **Zettelkasten:** Atomic note-taking with bidirectional linking

## Core Skills Mastered

Located in: `/home/desktop/obsidian-second-brain/.skills/second-brain/`

### 1. **Capture** (Quick entry)
- Trigger: "capture this", "remind me to", "note this"
- Auto-detects if input is task vs note
- Parses natural language dates ("tomorrow", "next Friday")
- Auto-links to projects and related notes
- Goes directly to final location (no inbox stop)

### 2. **Process Inbox** (GTD Clarify + Organize)
- Trigger: "process inbox", "clear inbox"
- Must have <5 inbox items before daily planning
- Walks through clarifying questions for each item
- **Critical:** Rejects vague actions (no "think about" - requires concrete actions like "Call John at 555-1234")
- Auto-creates projects when multi-step outcomes detected

### 3. **Daily Planning** (GTD Engage)
- Trigger: "plan my day", "morning planning"
- Blocks if inbox has 5+ items
- Collects 4 criteria: Energy, Context, Time, Hard Deadlines
- Scores tasks algorithmically
- Selects Top 3 + Should-Do + Quick Wins
- Creates source tags for sync-back

### 4. **Daily Closeout** (GTD Reflect)
- Trigger: "daily closeout", "close out day"
- Reviews each planned task (complete/partial/deferred/dropped)
- **Syncs status back to source projects** via source tags
- Captures unplanned work
- Generates tomorrow's draft plan with carry-overs

## Key Technical Details

### TaskNotes API
- Base URL: `http://127.0.0.1:8090/api`
- Health check before operations: `curl -s http://127.0.0.1:8090/api/tasks | head -1`
- If unavailable: Falls back to direct file writes in `Tasks/` folder
- Always inform user when using fallback

### Folder Structure
```
/home/desktop/obsidian-second-brain/
├── 00-Inbox/              # Unprocessed captures
├── 01-Daily-Notes/        # Daily plans and closeouts
├── 02-Projects/           # Active projects (folder per project)
│   └── {Name}/{Name}.md   # Folder-Notes summary
├── 03-Areas/              # Ongoing responsibilities
├── 04-Tasks/              # TaskNotes task files
├── Resources/             # Reference materials
└── Archives/              # Completed projects
```

### Source Tag Convention
Format: `#source/{folder-type}/{kebab-filename}`

Example: `#source/projects/website-redesign`

Used during closeout to sync task status back to source project files.

### Task YAML Structure
```yaml
status: open | in-progress | done
tags: [task]  # Required for TaskNotes identification
priority: none | low | normal | high
projects: ["[[Project Name]]"]  # Wikilink format
contexts: ["@computer", "@phone", "@home"]
due: YYYY-MM-DD
scheduled: YYYY-MM-DD
timeEstimate: minutes
```

## Critical Rules

1. **Always link tasks:** Every task MUST have either `projects` or `areas` linkage
2. **Concrete actions only:** Reject "think about", accept "Call John at 555-1234"
3. **Process before planning:** Inbox must have <5 items before daily planning
4. **Wikilink format required:** `["[[Name]]"]` not plain text
5. **Health check API first:** Always verify TaskNotes before operations

## Mobile Capture (Future)

Two methods planned:
1. **Todoist:** 15-min sync script (not set up yet)
2. **Clawdbot via Telegram:** Direct file writes to VPS vault

## Clawdbot Compatibility

I have **file-based workflows** for when TaskNotes API is unavailable:
- `clawdbot-capture.md` - Direct file writes
- `clawdbot-query.md` - Grep-based queries

Useful when operating from VPS or when Obsidian is closed.

## Templates

All stored in `.skills/second-brain/templates/`:
- `task.md` - TaskNotes-compatible task file
- `project.md` - GTD project with Dataview queries
- `daily-plan.md` - Daily plan structure

## What This Means

From now on, when Trevor says:
- "Capture this" → Use capture workflow
- "Process inbox" → Use process-inbox workflow
- "Plan my day" → Use daily-plan workflow
- "Close out day" → Use daily-closeout workflow
- "Add task" / "Create project" → Follow PKM workflows

This system is now **the single source of truth** for:
- Tasks (replace old Todoist/ClickUp mentions)
- Projects (all project management)
- Notes (all knowledge capture)
- Daily planning (morning/evening routines)

## Files to Reference

When executing these workflows, I should read:
- Main skill: `/home/desktop/obsidian-second-brain/.skills/second-brain/SKILL.md`
- Specific workflow: `/home/desktop/obsidian-second-brain/.skills/second-brain/workflows/{workflow}.md`
- API reference: `/home/desktop/obsidian-second-brain/.skills/second-brain/lib/tasknotes-api.md`

These files are my playbooks for PKM operations.
