# PKM System Project

**Status:** 🟢 Active
**Created:** 2025-06-25
**Deadline:** None (ongoing development)

## 🔥 Urgent Tasks
- [ ] Get API tokens from Trevor (Todoist, ClickUp, Toggl)
- [ ] Determine Obsidian vault path
- [ ] Set up web search API (Brave) for research capabilities

## Overview

Building a comprehensive Personal Knowledge Management system integrating:
- **Obsidian** - PARA-based vault structure, daily planning, project notes
- **Todoist** - Quick task capture (inbox)
- **ClickUp** - Master task/project management
- **Toggl** - Time tracking

## Components Built

### ✅ Completed
- [x] System design document (`docs/DESIGN.md`)
- [x] Obsidian vault structure specification
- [x] Todoist API integration (`scripts/todoist-api.ts`)
- [x] ClickUp API integration (`scripts/clickup-api.ts`)
- [x] Toggl API integration (`scripts/toggl-api.ts`)
- [x] Skill: pkm-inbox-process
- [x] Skill: pkm-daily-plan
- [x] Skill: pkm-create-task
- [x] Skill: pkm-project
- [x] Vault setup guide (`docs/VAULT-SETUP.md`)

### 🔲 To Do
- [ ] Get and configure API tokens
- [ ] Test API connections
- [ ] Create Obsidian vault structure
- [ ] Install skills into Clawdbot
- [ ] Test full workflow
- [ ] Integrate with existing Trevor projects

## Key Links
- Design: `docs/DESIGN.md`
- Vault Setup: `docs/VAULT-SETUP.md`
- Scripts: `scripts/`
- Skills: `skills/`

## Project Structure

```
projects/pkm-system/
├── _summary.md (this file)
├── docs/
│   ├── DESIGN.md
│   └── VAULT-SETUP.md
├── scripts/
│   ├── todoist-api.ts
│   ├── clickup-api.ts
│   └── toggl-api.ts
└── skills/
    ├── pkm-inbox-process/
    ├── pkm-daily-plan/
    ├── pkm-create-task/
    └── pkm-project/
```

## Recent Updates
- 2025-06-25: Project created, design docs complete, API scripts written, skills defined
