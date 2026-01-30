---
name: pkm-inbox-process
description: Process inbox items from Obsidian, Todoist, and ClickUp. Use when user says "process inbox", "check inbox", "what's new", "clear inbox", or wants to review captured items and route them to appropriate locations (projects, areas, resources, archive).
---

# PKM Inbox Processing

Process and route inbox items from multiple sources into the PARA system.

## Sources to Check

1. **Obsidian Inbox** - `{vault}/0-Inbox/` folder
2. **Todoist Inbox** - Items in Todoist Inbox project
3. **ClickUp Inbox** - Unassigned or inbox-tagged tasks

## Processing Workflow

### 1. Gather Inbox Items

```bash
# Check Obsidian inbox
ls -la "${OBSIDIAN_VAULT}/0-Inbox/"

# Check Todoist (requires API)
# Use todoist-api.ts getInboxTasks()

# Check ClickUp (requires API)
# Look for tasks without list assignment or with "inbox" tag
```

### 2. Present Items for Processing

Display each item with:
- Source (Obsidian/Todoist/ClickUp)
- Title/content
- Created date
- Any existing context (tags, project hints)

### 3. Route Each Item

Ask user or infer destination:

| Decision | Action |
|----------|--------|
| **Project** | Move to `1-Projects/{project-name}/` |
| **Area** | Move to `2-Areas/{area}/` |
| **Resource** | Move to `3-Resources/` |
| **Archive** | Move to `4-Archive/` |
| **Task** | Create task in ClickUp, link in project |
| **Delete** | Remove if no longer relevant |

### 4. For Project Items

When routing to a project:
1. Create note in `1-Projects/{project}/notes/`
2. If it's a task, add to `tasks.md`
3. If urgent, add to `_summary.md` urgent section
4. Optionally create ClickUp task

### 5. Update Todoist Items

After processing Todoist items:
- Close item in Todoist (it's now in ClickUp/Obsidian)
- Or move to appropriate Todoist project if keeping there

## Configuration Required

Environment variables or config:
```
OBSIDIAN_VAULT=/path/to/vault
TODOIST_API_TOKEN=xxx
CLICKUP_API_TOKEN=xxx
CLICKUP_TEAM_ID=xxx
```

## Output Format

After processing, provide summary:
```markdown
## Inbox Processed

**Obsidian:** 3 items
- "Meeting notes" → Projects/nomads-bangkok
- "API documentation link" → Resources/Development
- "Random thought" → Archive

**Todoist:** 5 items
- "Call supplier" → Created ClickUp task in Nomads Bangkok
- "Review analytics" → Created ClickUp task in Marketing
...

**Remaining:** 2 items need manual review
```

## Quick Commands

- "Quick process" - Auto-route obvious items, flag ambiguous ones
- "Show inbox" - List all items without processing
- "Clear inbox" - Process everything, prompt for each
