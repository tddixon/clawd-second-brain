---
name: pkm-daily-plan
description: Create or update daily plan in Obsidian. Use when user says "daily plan", "plan my day", "what's on today", "morning routine", "start day", or needs to see today's tasks, calendar, and priorities organized.
---

# PKM Daily Plan

Generate a daily plan document pulling tasks from ClickUp, Todoist, and calendar.

## Daily Plan Location

`{vault}/Daily/YYYY-MM-DD.md`

## Generation Workflow

### 1. Gather Data

```bash
# Get today's date
DATE=$(date +%Y-%m-%d)

# Check if plan exists
if [ -f "${OBSIDIAN_VAULT}/Daily/${DATE}.md" ]; then
  # Update existing plan
else
  # Create new plan from template
fi
```

Data sources:
- **ClickUp:** Tasks due today or overdue (clickup-api.ts getTasksDueToday)
- **Todoist:** Today's tasks (todoist-api.ts getTodayTasks)
- **Calendar:** Google Calendar events (gcal integration)
- **Projects:** Urgent items from `1-Projects/*/_summary.md`

### 2. Template Structure

```markdown
# YYYY-MM-DD - Daily Plan

## 🎯 Top 3 Priorities
1. [ ] {highest impact task}
2. [ ] {second priority}
3. [ ] {third priority}

## 📅 Schedule
| Time | Event |
|------|-------|
| 09:00 | Meeting with X |
| 14:00 | Call with Y |

## 📋 Tasks

### 🔴 Overdue
- [ ] Task name (Project: X, Due: Y)

### 📆 Due Today
- [ ] Task from ClickUp
- [ ] Task from Todoist

### 🎯 From Projects
**Project A:**
- [ ] Urgent task 1
- [ ] Urgent task 2

### 📥 Quick Tasks
- [ ] Todoist quick capture items

## 🕐 Time Tracking
| Task | Project | Start | End | Duration |
|------|---------|-------|-----|----------|
| ... | ... | ... | ... | ... |

## 📝 Notes
(Working notes throughout the day)

## ✅ End of Day Review
- **Completed:** X/Y tasks
- **Carry forward:** ...
- **Wins:** ...
- **Lessons:** ...
```

### 3. Priority Selection

Help user identify top 3 by:
1. Check deadlines (what's most urgent?)
2. Check project urgency flags
3. Ask: "What would make today a success?"

### 4. Calendar Integration

Pull calendar events and block time:
- Show events with times
- Identify free blocks for deep work
- Flag conflicts

### 5. Time Estimation

For each task, optionally add estimate:
- `[30m]` for quick tasks
- `[2h]` for deep work
- Sum totals vs available time

## Commands

| Trigger | Action |
|---------|--------|
| "Plan my day" | Full plan generation |
| "What's on today" | Quick summary |
| "Morning routine" | Generate plan + process inbox |
| "Update plan" | Refresh tasks from sources |
| "End of day" | Review and close out |

## End of Day Workflow

1. Mark completed tasks in ClickUp/Todoist
2. Review what didn't get done
3. Update project summaries if needed
4. Identify carry-forward items
5. Quick reflection: wins and lessons

## Configuration

```
OBSIDIAN_VAULT=/path/to/vault
TODOIST_API_TOKEN=xxx
CLICKUP_API_TOKEN=xxx
CLICKUP_TEAM_ID=xxx
GOOGLE_CALENDAR_ID=xxx (optional)
```

## Tips

- Run after inbox processing for clean start
- Time-block your top 3 priorities first
- Leave buffer for unexpected tasks
- Review plan mid-day if needed
