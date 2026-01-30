# Obsidian Vault Setup Guide

## Quick Setup

Run this to create the PARA structure in your vault:

```bash
VAULT="/path/to/your/obsidian/vault"

# Create PARA structure
mkdir -p "$VAULT/0-Inbox"
mkdir -p "$VAULT/1-Projects"
mkdir -p "$VAULT/2-Areas/Marketing"
mkdir -p "$VAULT/2-Areas/Operations"
mkdir -p "$VAULT/2-Areas/Finance"
mkdir -p "$VAULT/2-Areas/Personal"
mkdir -p "$VAULT/3-Resources/Templates"
mkdir -p "$VAULT/3-Resources/Procedures"
mkdir -p "$VAULT/3-Resources/Knowledge"
mkdir -p "$VAULT/4-Archive"
mkdir -p "$VAULT/Daily"
mkdir -p "$VAULT/_system/templates"
```

## Folder Descriptions

### 0-Inbox
Quick capture zone. Anything unprocessed lands here. Process regularly.

### 1-Projects
Active projects with defined outcomes and deadlines.
Each project gets its own folder with standard structure:
```
project-name/
├── _summary.md
├── tasks.md
├── references/
└── notes/
```

### 2-Areas
Ongoing responsibilities without end dates:
- **Marketing** - SEO, content, social, campaigns
- **Operations** - Day-to-day hostel operations
- **Finance** - Budgets, accounting, reports
- **Personal** - Health, learning, relationships

### 3-Resources
Reference material organized by topic:
- **Templates** - Reusable templates
- **Procedures** - How-to guides, SOPs
- **Knowledge** - Research, learning notes

### 4-Archive
Completed or inactive items. Organized by year.

### Daily
Daily planning documents: `YYYY-MM-DD.md`

### _system
PKM system configuration and templates.

---

## Templates

### Project Summary Template

Save as `_system/templates/project-summary.md`:

```markdown
# {{title}}

**Status:** 🟢 Active
**Created:** {{date}}
**Deadline:** 
**ClickUp:** [Link]()

## 🔥 Urgent Tasks
- [ ] 

## Overview


## Key Links
- 

## Recent Updates
- {{date}}: Project created
```

### Daily Plan Template

Save as `_system/templates/daily-plan.md`:

```markdown
# {{date}} - Daily Plan

## 🎯 Top 3 Priorities
1. [ ] 
2. [ ] 
3. [ ] 

## 📅 Schedule
| Time | Event |
|------|-------|
| | |

## 📋 Tasks

### Due Today
- [ ] 

### From Projects
- [ ] 

## 📝 Notes


## ✅ End of Day Review
- **Completed:** 
- **Carry forward:** 
- **Wins:** 
```

---

## Recommended Plugins

- **Templater** - For template insertion
- **Dataview** - For dynamic task queries
- **Calendar** - Visual calendar navigation
- **Tasks** - Enhanced task management
- **Periodic Notes** - Auto-create daily notes

## Dataview Queries

### All Urgent Tasks (across projects)
```dataview
TASK
FROM "1-Projects"
WHERE !completed AND contains(text, "🔥") OR contains(text, "urgent")
```

### Projects by Status
```dataview
TABLE status, deadline
FROM "1-Projects"
WHERE file.name = "_summary"
```

### Today's Tasks
```dataview
TASK
WHERE contains(text, date(today)) AND !completed
```
