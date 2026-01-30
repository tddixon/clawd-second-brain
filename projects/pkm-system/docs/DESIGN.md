# Personal Knowledge Management System Design

## Overview

A PARA-based PKM system integrating Obsidian, Todoist, ClickUp, and Toggl with AI-powered automation.

---

## Core Components

### 1. Obsidian Vault Structure (PARA)

```
vault/
├── 0-Inbox/                    # Capture zone (quick notes, clippings)
├── 1-Projects/                 # Active projects
│   └── project-name/
│       ├── _summary.md         # Project overview + urgent tasks
│       ├── tasks.md            # Full task list
│       ├── references/         # Links, docs, research
│       └── notes/              # Working notes
├── 2-Areas/                    # Ongoing responsibilities
│   ├── Marketing/
│   ├── Operations/
│   ├── Finance/
│   └── Personal/
├── 3-Resources/                # Reference material
│   ├── Templates/
│   ├── Procedures/
│   └── Knowledge/
├── 4-Archive/                  # Completed/inactive
├── Daily/                      # Daily notes & plans
│   └── YYYY-MM-DD.md
└── _system/                    # PKM system files
    ├── templates/
    └── config.md
```

### 2. Project Template (_summary.md)

```markdown
# Project Name

**Status:** 🟢 Active | 🟡 Paused | 🔴 Blocked
**Deadline:** YYYY-MM-DD
**ClickUp ID:** [link]

## 🔥 Urgent Tasks
- [ ] Task with deadline (Due: YYYY-MM-DD)
- [ ] Another urgent task

## Overview
Brief project description and goals.

## Key Links
- [ClickUp Project](url)
- [GitHub Repo](url)
- [Documentation](url)

## Recent Updates
- YYYY-MM-DD: Update note
```

### 3. Daily Plan Template

```markdown
# YYYY-MM-DD - Daily Plan

## 🎯 Top 3 Priorities
1. [ ] Priority one
2. [ ] Priority two
3. [ ] Priority three

## 📋 Tasks
### From ClickUp
- [ ] Task (Project: X, Due: Y)

### From Todoist
- [ ] Quick task

### Ad-hoc
- [ ] Additional tasks

## 📅 Calendar
- HH:MM - Event name

## 🕐 Time Tracked
| Task | Project | Duration |
|------|---------|----------|
| ... | ... | ... |

## 📝 Notes
...

## ✅ End of Day Review
- Completed: X/Y tasks
- Carry forward: ...
- Lessons: ...
```

---

## Skills Architecture

### 1. `pkm-inbox-process`
**Trigger:** "process inbox", "check inbox", "what's new"

**Actions:**
1. Check Obsidian 0-Inbox/ for new items
2. Pull new/updated tasks from Todoist
3. Pull new/updated tasks from ClickUp
4. Present summary of items needing processing
5. Help route items to correct location (project, area, resource, archive)

### 2. `pkm-daily-plan`
**Trigger:** "daily plan", "plan my day", "what's on today"

**Actions:**
1. Create/update Daily/YYYY-MM-DD.md
2. Pull today's tasks from ClickUp (due today or overdue)
3. Pull today's tasks from Todoist
4. Pull calendar events
5. Summarize urgent items from active projects
6. Generate prioritized plan

### 3. `pkm-create-task`
**Trigger:** "add task", "create task", "remind me to"

**Actions:**
1. Parse task details (title, project, due date, priority)
2. Create in appropriate system:
   - Quick capture → Todoist inbox
   - Project task → ClickUp
   - One-off reminder → Todoist or Cron
3. Optionally add to Obsidian project folder

### 4. `pkm-project`
**Trigger:** "create project", "update project", "project status"

**Actions:**
1. Create new project folder structure in Obsidian
2. Create corresponding ClickUp project
3. Generate _summary.md with template
4. Link systems together

---

## API Integrations

### Todoist API
- **Base URL:** https://api.todoist.com/rest/v2
- **Auth:** Bearer token
- **Key Endpoints:**
  - GET /tasks - List tasks
  - POST /tasks - Create task
  - POST /tasks/{id}/close - Complete task
  - GET /projects - List projects

### ClickUp API
- **Base URL:** https://api.clickup.com/api/v2
- **Auth:** Bearer token
- **Key Endpoints:**
  - GET /team/{team_id}/space - List spaces
  - GET /list/{list_id}/task - List tasks
  - POST /list/{list_id}/task - Create task
  - PUT /task/{task_id} - Update task

### Toggl Track API
- **Base URL:** https://api.track.toggl.com/api/v9
- **Auth:** Basic auth (api_token:api_token)
- **Key Endpoints:**
  - GET /me/time_entries - List time entries
  - POST /workspaces/{id}/time_entries - Create entry
  - GET /me/projects - List projects
  - GET /reports/api/v3/workspace/{id}/summary - Summary report

---

## Integration Scripts

### `sync-todoist.ts`
- Pull tasks from Todoist API
- Identify new/changed tasks
- Return structured data for processing

### `sync-clickup.ts`
- Pull tasks from ClickUp spaces/lists
- Filter by assignee, due date, status
- Return structured data

### `sync-toggl.ts`
- Pull time entries for date range
- Aggregate by project/task
- Return summary data

### `push-task.ts`
- Create task in Todoist or ClickUp
- Handle project mapping
- Return created task details

---

## Workflow Automations

### Morning Routine
1. `pkm-inbox-process` - Clear overnight captures
2. `pkm-daily-plan` - Generate today's plan
3. Review calendar
4. Start time tracking

### Task Capture Flow
1. Quick capture → Todoist inbox (mobile-friendly)
2. Periodic process → Move to ClickUp with context
3. Daily plan → Pull into Obsidian for execution

### End of Day
1. Stop time tracking
2. Review completed tasks
3. Update project summaries
4. Process any remaining inbox items
5. Note carry-forward items

---

## Implementation Phases

### Phase 1: Foundation
- [ ] Create Obsidian vault structure
- [ ] Build API integration scripts
- [ ] Test API connections

### Phase 2: Skills
- [ ] Create pkm-inbox-process skill
- [ ] Create pkm-daily-plan skill
- [ ] Create pkm-create-task skill
- [ ] Create pkm-project skill

### Phase 3: Automation
- [ ] Set up heartbeat checks for inbox
- [ ] Configure daily plan generation
- [ ] Time tracking integration

### Phase 4: Refinement
- [ ] Add reporting/analytics
- [ ] Optimize workflows based on usage
- [ ] Add more automation triggers

---

## Configuration Required

```yaml
# Required API tokens (store securely)
todoist:
  api_token: "xxx"

clickup:
  api_token: "xxx"
  team_id: "xxx"
  default_space_id: "xxx"

toggl:
  api_token: "xxx"
  workspace_id: "xxx"

obsidian:
  vault_path: "/path/to/vault"
```

---

## Notes

- All tasks maintain ClickUp as source of truth
- Todoist is capture-only (inbox), not long-term storage
- Obsidian provides planning layer and knowledge base
- Toggl tracks time against ClickUp projects
