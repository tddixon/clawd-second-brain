---
name: pkm-create-task
description: Create tasks in Todoist, ClickUp, or Obsidian. Use when user says "add task", "create task", "remind me to", "todo", "new task", or wants to capture a task with optional project, due date, and priority.
---

# PKM Create Task

Intelligently route task creation to the appropriate system.

## Routing Logic

| Context | Destination |
|---------|-------------|
| Quick capture, no project | Todoist Inbox |
| Has project context | ClickUp (in project list) |
| Personal reminder | Todoist or Cron job |
| Meeting follow-up | ClickUp + link in meeting notes |

## Task Parsing

Extract from natural language:
- **Title:** Main task description
- **Project:** Mentioned project name or inferred
- **Due date:** "tomorrow", "next week", "Jan 15"
- **Priority:** "urgent", "high priority", "when you can"
- **Assignee:** "for me", "assign to X"
- **Tags:** #tag mentions

### Examples

| Input | Parsed |
|-------|--------|
| "remind me to call John tomorrow" | Title: "Call John", Due: tomorrow, Dest: Todoist |
| "add task to booking engine: fix payment flow, urgent" | Title: "Fix payment flow", Project: Booking Engine, Priority: High, Dest: ClickUp |
| "todo: review SEO keywords" | Title: "Review SEO keywords", Dest: Todoist inbox |

## Creation Workflow

### Quick Capture (Todoist)

```typescript
// todoist-api.ts
await api.createTask({
  content: "Task title",
  due_string: "tomorrow",
  priority: 4, // 1=low, 4=urgent
});
```

### Project Task (ClickUp)

```typescript
// clickup-api.ts
await api.createTask(listId, {
  name: "Task title",
  description: "Details...",
  due_date: Date.now() + 86400000, // tomorrow
  priority: 2, // 1=urgent, 2=high, 3=normal, 4=low
});
```

### Also Add to Obsidian

When creating project tasks, optionally add to:
`1-Projects/{project}/tasks.md`

```markdown
- [ ] Task title (ClickUp: {task_id}, Due: YYYY-MM-DD)
```

If urgent, also add to `_summary.md` urgent section.

## Confirmation

After creation, confirm:
```
✅ Created task: "Fix payment flow"
📍 Location: ClickUp → Booking Engine → Development
📅 Due: 2025-01-27
🔴 Priority: High
🔗 Link: https://app.clickup.com/t/xxxxx
```

## Batch Creation

Support multiple tasks:
```
"Add tasks to Nomads Bangkok project:
- Order furniture
- Schedule contractor meeting
- Review permits"
```

Creates 3 tasks in the same ClickUp list.

## Recurring Tasks

For recurring tasks, use ClickUp's recurrence or Todoist:
- "every monday"
- "daily"
- "first of month"

## Quick Commands

| Command | Action |
|---------|--------|
| "quick task: X" | Todoist inbox, no questions |
| "task for project X: Y" | ClickUp in project X |
| "remind me: X at TIME" | Cron job for reminder |
| "urgent: X" | High priority, Todoist or ClickUp |

## Configuration

```
TODOIST_API_TOKEN=xxx
CLICKUP_API_TOKEN=xxx
CLICKUP_TEAM_ID=xxx
CLICKUP_DEFAULT_LIST_ID=xxx (optional fallback)
```
