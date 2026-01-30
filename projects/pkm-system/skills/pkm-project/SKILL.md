---
name: pkm-project
description: Create and manage projects in Obsidian and ClickUp. Use when user says "create project", "new project", "project status", "update project", "show projects", or needs to set up or review project structure with summary, tasks, references, and notes.
---

# PKM Project Management

Create and maintain project structure across Obsidian and ClickUp.

## Project Structure (Obsidian)

```
1-Projects/
└── project-name/
    ├── _summary.md      # Overview, urgent tasks, status
    ├── tasks.md         # Full task list
    ├── references/      # Links, docs, research
    │   └── ...
    └── notes/           # Working notes
        └── ...
```

## Create New Project

### 1. Gather Info

Required:
- Project name (kebab-case for folder)
- Brief description
- Deadline (if any)

Optional:
- ClickUp space/list to link
- Initial tasks
- Key references

### 2. Create Obsidian Structure

```bash
PROJECT_DIR="${OBSIDIAN_VAULT}/1-Projects/${project_name}"
mkdir -p "${PROJECT_DIR}/references"
mkdir -p "${PROJECT_DIR}/notes"
```

### 3. Generate _summary.md

```markdown
# {Project Name}

**Status:** 🟢 Active
**Created:** YYYY-MM-DD
**Deadline:** YYYY-MM-DD (or "None")
**ClickUp:** [Project Link](url)

## 🔥 Urgent Tasks
<!-- Tasks due within 7 days or flagged urgent -->
- [ ] Task 1 (Due: YYYY-MM-DD)

## Overview
{Brief description of project goals and scope}

## Key Links
- [ClickUp Project](url)
- [GitHub Repo](url) (if applicable)
- [Documentation](url)

## Team
- Owner: {name}
- Contributors: {names}

## Recent Updates
- YYYY-MM-DD: Project created
```

### 4. Generate tasks.md

```markdown
# {Project Name} - Tasks

## To Do
- [ ] Task 1
- [ ] Task 2

## In Progress
- [ ] Task 3 (started YYYY-MM-DD)

## Done
- [x] Completed task (done YYYY-MM-DD)

---
*Synced with ClickUp: [link]*
```

### 5. Create ClickUp List (Optional)

If not linking to existing:
```typescript
// Create folder or list in appropriate space
await api.createList(folderId, { name: projectName });
```

## Project Status Commands

| Command | Action |
|---------|--------|
| "project status" | Show all active projects summary |
| "status of X" | Detailed status of specific project |
| "show projects" | List all projects with status |
| "archive project X" | Move to 4-Archive |

## Update Project Summary

When tasks change:
1. Pull tasks from ClickUp
2. Update `_summary.md` urgent section (due within 7 days)
3. Update `tasks.md` with current state

```markdown
## Project Status Report

### 🟢 Active Projects (5)

**Nomads Asia Website**
- Status: In Progress
- Urgent: 2 tasks due this week
- Last update: 2 days ago

**Booking Engine Integration**
- Status: 🔴 Blocked
- Urgent: Waiting on MEWS API access
- Last update: today
...
```

## Archive Project

When project completes:
1. Update status to "✅ Complete"
2. Move folder to `4-Archive/YYYY/project-name/`
3. Close ClickUp tasks
4. Add completion notes

## Quick Commands

| Command | Action |
|---------|--------|
| "new project: X" | Create full structure |
| "link project X to ClickUp Y" | Connect existing |
| "project X urgent tasks" | Show only urgent |
| "update all projects" | Refresh all summaries |
| "archive X" | Complete and archive |

## Configuration

```
OBSIDIAN_VAULT=/path/to/vault
CLICKUP_API_TOKEN=xxx
CLICKUP_TEAM_ID=xxx
CLICKUP_DEFAULT_SPACE_ID=xxx
```
