---
name: tasknotes
description: |
  TaskNotes file-based task management for Obsidian.
  Create, read, and manage tasks using proper YAML frontmatter structure.
  No API dependency - direct file operations following tasknotes.dev spec.
triggers: "create task", "add task", "new task", "task for"
---

# TaskNotes Skill

File-based task management following the TaskNotes (tasknotes.dev) specification. Creates and manages tasks as individual Markdown files with structured YAML frontmatter.

## Core Principle

**One note per task** - Each task is a separate `.md` file with YAML frontmatter containing structured, queryable properties.

## Task File Structure

### Minimal Valid Task

```yaml
---
tags:
  - task
title: "Task title here"
---

Optional body content, notes, meeting notes, checklists, etc.
```

### Full Task Example

```yaml
---
tags:
  - task
title: "Review quarterly report"
status: in-progress
priority: high
due: 2026-01-15
scheduled: 2026-01-14
contexts:
  - "@office"
  - "@computer"
projects:
  - "[[Q1 Planning]]"
  - "[[Work]]"
timeEstimate: 60
---

## Notes

Key points to review:
- Revenue projections
- Budget allocations

## Meeting Notes

Discussion with finance team on 2026-01-10...
```

## Required Fields

**MUST include:**
- `tags: [task]` - Required for TaskNotes to identify the file as a task
- `title` - Task description

## Standard Fields

### Status
**Type:** Text  
**Values:** Configurable in TaskNotes settings  
**Default:** `open`, `in-progress`, `done`  
**Example:** `status: in-progress`

### Priority
**Type:** Text  
**Values:** `none`, `low`, `normal`, `high`  
**Default:** `normal`  
**Example:** `priority: high`

### Dates

**due** - When task must be complete  
**Format:** `YYYY-MM-DD` or `YYYY-MM-DDTHH:MM`  
**Example:** `due: 2026-01-15`

**scheduled** - When you plan to work on it  
**Format:** `YYYY-MM-DD` or `YYYY-MM-DDTHH:MM`  
**Example:** `scheduled: 2026-01-14T09:00`

### Contexts (GTD)
**Type:** List  
**Format:** Array of strings starting with `@`  
**Example:**
```yaml
contexts:
  - "@office"
  - "@phone"
  - "@computer"
```

### Projects
**Type:** List  
**Format:** Array of wikilinks  
**Example:**
```yaml
projects:
  - "[[Project-Alpha]]"
  - "[[Work]]"
```

**CRITICAL:** 
- Use wikilink format `"[[Name]]"` not plain text!
- **Match EXACT filename** (without .md extension)
- If filename is `Project-Name.md`, use `"[[Project-Name]]"` (with hyphens)
- If filename is `Project Name.md`, use `"[[Project Name]]"` (with spaces)
- For Dataview queries to work, the wikilink must match the filename exactly!

### Time Estimate
**Type:** Number (minutes)  
**Example:** `timeEstimate: 60`

### Tags
**Type:** List  
**Example:**
```yaml
tags:
  - task
  - urgent
  - meeting
```

**Note:** `task` tag is REQUIRED - additional tags optional

## Recurring Tasks

**Format:** RRule with DTSTART (RFC 5545)

```yaml
recurrence: "DTSTART:20260804T090000Z;FREQ=DAILY"
scheduled: "2026-08-04T09:00"
complete_instances: []
```

**Examples:**
- Daily: `DTSTART:20260804T090000Z;FREQ=DAILY`
- Weekly Mon/Wed/Fri: `DTSTART:20260804T140000Z;FREQ=WEEKLY;BYDAY=MO,WE,FR`
- Monthly 15th: `DTSTART:20260815;FREQ=MONTHLY;BYMONTHDAY=15`
- Last Friday: `DTSTART:20260801T100000Z;FREQ=MONTHLY;BYDAY=-1FR`

## Reminders

**Format:** Array of reminder objects

```yaml
reminders:
  - id: "rem_1678886400000_abc123xyz"
    type: "relative"
    relatedTo: "due"
    offset: "-PT15M"
    description: "Review task details"
  - id: "rem_1678886400001_def456uvw"
    type: "absolute"
    absoluteTime: "2026-10-26T09:00:00"
    description: "Follow up"
```

**Relative reminder types:**
- `relatedTo`: `"due"` or `"scheduled"`
- `offset`: ISO 8601 duration (negative = before, positive = after)
  - `-PT15M` = 15 minutes before
  - `-PT1H` = 1 hour before
  - `-P1D` = 1 day before

## Dependencies

**Format:** Structured objects using RFC 9253

```yaml
blockedBy:
  - uid: "[[Operations/Order hardware]]"
    reltype: FINISHTOSTART
    gap: P1D
```

**Relationship types:**
- `FINISHTOSTART` (default)
- `FINISHTOFINISH`
- `STARTTOSTART`
- `STARTTOFINISH`

## Custom Fields

Any additional frontmatter property can be added. Common examples:

```yaml
assignee: "John Doe"
client: "Acme Corp"
estimate: "2 hours"
milestone: "[[Q1 Launch]]"
```

## Filename Conventions

TaskNotes supports multiple patterns:

1. **Title-based** (default): `Review-quarterly-report.md`
2. **Timestamp**: `20260127-130000.md`
3. **Zettelkasten**: `202601271300.md`
4. **Custom template**

**Sanitization:** Title is auto-sanitized to remove forbidden filename characters.

## File Location

**Default:** `TaskNotes/Tasks/`  
**Configurable:** Set in TaskNotes settings

## Task Creation Workflow

### 1. Determine Task Properties

**From user input, extract:**
- Title (required)
- Project(s) - WikiLink format
- Area(s) - WikiLink format if applicable
- Due date - Parse natural language
- Scheduled date - Parse natural language or use today
- Priority - Infer from context or use `normal`
- Contexts - Infer from keywords (@office, @phone, etc.)
- Status - Default: `open`

### 2. Generate Filename

**Pattern:** Kebab-case from title

**Examples:**
- "Call John about meeting" → `Call-John-about-meeting.md`
- "Review Q1 report" → `Review-Q1-report.md`

**Sanitization rules:**
- Remove: `/ \ : * ? " < > |`
- Replace spaces with hyphens
- Lowercase recommended but not required

### 3. Create File

**Location:** `{vault}/Tasks/{filename}.md`

**Template:**
```yaml
---
tags:
  - task
title: "{title}"
status: {status}
priority: {priority}
{due_field}
{scheduled_field}
{contexts_field}
{projects_field}
{areas_field}
{time_estimate_field}
---

{body_content}
```

### 4. Wiki-Link Integration

**CRITICAL:** Ensure task links to projects/areas

**Tasks MUST include either:**
- `projects: ["[[Project Name]]"]`, OR
- `areas: ["[[Area Name]]"]`, OR
- Both

**Example:**
```yaml
projects:
  - "[[Nomads Bangkok Opening]]"
areas:
  - "[[Work]]"
```

## Date Parsing

### Relative Dates
- `today` → Current date
- `tomorrow` → Current date + 1
- `next Monday` → Next occurrence of Monday
- `in 3 days` → Current date + 3
- `next week` → Monday of next week
- `end of month` → Last day of current month

### Specific Dates
- `Jan 15` → YYYY-01-15 (current or next year)
- `2026-01-15` → ISO format (use as-is)
- `1/15` → YYYY-01-15

**Output:** Always convert to ISO format: `YYYY-MM-DD` or `YYYY-MM-DDTHH:MM`

## Context Detection

**Auto-detect from keywords:**

| Keyword | Context |
|---------|---------|
| call, phone | @phone |
| computer, laptop, email | @computer |
| office, desk | @office |
| home | @home |
| errands, store, buy | @errands |
| anywhere, any | (no context) |

## Priority Inference

**Auto-detect from keywords:**

| Keyword | Priority |
|---------|----------|
| urgent, critical, asap, high priority | high |
| low priority, someday, maybe | low |
| (default) | normal |

## Error Handling

### Invalid Project Reference
**If project WikiLink doesn't exist:**
1. Inform user project doesn't exist
2. Offer to create project first
3. Or create task without project

### Missing Required Fields
**If title missing:**
- Reject creation
- Request clear task title

### File Write Failure
**If can't write to Tasks/ folder:**
1. Try fallback location: `Inbox/`
2. If that fails, report error
3. Suggest checking permissions

## Reading Tasks

### Query Tasks by Status

```bash
# Get all open tasks
grep -l "status: open" {vault}/Tasks/*.md

# Get all tasks for a project
grep -l 'projects:.*\[\[Project Name\]\]' {vault}/Tasks/*.md
```

### Parse Task File

```bash
# Extract title
grep "^title:" {vault}/Tasks/task.md

# Extract due date
grep "^due:" {vault}/Tasks/task.md
```

## Updating Tasks

### Change Status

```bash
# Read file
cat {vault}/Tasks/task.md

# Replace status line
sed -i 's/^status: open$/status: done/' {vault}/Tasks/task.md
```

### Add Project Link

```bash
# Add project to existing projects array
# Or insert projects field if missing
```

## Integration with Second Brain

### Task → Project Linking

**Every task created should:**
1. Link to parent project via `projects: ["[[Project]]"]`
2. Link to area via `areas: ["[[Area]]"]`
3. Be discoverable in project's Dataview query

**Project's Open Tasks query:**
```dataview
TABLE priority, due, status
FROM "Tasks"
WHERE contains(projects, this.file.link) AND status != "done"
SORT priority DESC, due ASC
```

### Sub-Project Tasks

**For sub-projects like "Nomads Bangkok Opening":**

```yaml
projects:
  - "[[Nomads Bangkok Opening]]"
areas:
  - "[[Work]]"
```

**Will appear in:**
- Nomads Bangkok Opening project page (via Dataview)
- Work area page (via Dataview)
- Parent Nomads project (if Dataview query includes sub-projects)

## Natural Language Parsing

**Supported patterns:**

```
"Buy groceries tomorrow at 3pm @home #errands high priority"

Extracts:
- title: "Buy groceries"
- scheduled: tomorrow at 3pm
- contexts: ["@home"]
- tags: ["task", "errands"]
- priority: high
```

**Markers:**
- `@` = context
- `#` = tag (in addition to required "task" tag)
- `+` = project (e.g., `+[[Project]]`)
- `*` = status (e.g., `*in-progress`)
- Date/time phrases = scheduled/due

## Best Practices

### 1. Always Include Required Tag
```yaml
tags:
  - task  # REQUIRED
```

### 2. Use WikiLinks for Projects
```yaml
projects:
  - "[[Project Name]]"  # Correct - wikilink
# NOT: ["Project Name"]  # Wrong - plain text
```

### 3. Link to Areas
```yaml
areas:
  - "[[Work]]"
  - "[[Personal]]"
```

### 4. Use Contexts for GTD
```yaml
contexts:
  - "@computer"
  - "@office"
```

### 5. Concrete Titles
- ✅ "Call John at 555-1234 about quote"
- ❌ "Think about calling John"

### 6. ISO Dates Always
```yaml
due: 2026-01-15
scheduled: 2026-01-14T09:00
```

## Quick Reference

### Create Task Command

**User says:** "Create task: {description}"

**Process:**
1. Parse description (title, dates, contexts, priority)
2. Detect project/area from context
3. Generate filename (kebab-case from title)
4. Create YAML frontmatter
5. Write to `{vault}/Tasks/{filename}.md`
6. Confirm creation with summary

### Minimum Valid Task

```yaml
---
tags:
  - task
title: "Task description"
---
```

### Recommended Task

```yaml
---
tags:
  - task
title: "Concrete action description"
status: open
priority: normal
scheduled: YYYY-MM-DD
contexts:
  - "@context"
projects:
  - "[[Project]]"
areas:
  - "[[Area]]"
---
```

## Project Integration

For project summary pages that display tasks, see:
- **Enhanced Queries:** `PROJECT-SUMMARY-IMPROVEMENTS.md`
- **Visual indicators** (🔴 🟡 🟢 for priority)
- **Clickable task links** in Dataview tables
- **Urgency indicators** (🚨 OVERDUE, 📍 TODAY)
- **Task statistics** and filtered views

**Example enhanced query:**
```dataview
TABLE WITHOUT ID
  ("[[" + file.name + "|" + title + "]]") as Task,
  choice(priority = "high", "🔴", "🟡") as "!",
  due as Due,
  timeEstimate as "Time"
FROM "Tasks"
WHERE contains(projects, this.file.link) AND status != "done"
SORT priority DESC, due ASC
```

## Vault Path

**Configured in:** Claude Memory or TOOLS.md  
**Default:** `/home/desktop/obsidian-second-brain`

## Architecture (Critical Understanding)

**TaskNotes is built on Obsidian Bases** - This is fundamental to how it works:

1. **Tasks = Notes:** Each task is a markdown file with YAML frontmatter
2. **Views = .base Files:** All views (Task List, Kanban, Calendar) are Bases queries in `TaskNotes/Views/`
3. **No Plugin Database:** Everything is portable markdown + YAML
4. **Formula Properties:** Computed fields in .base files (urgencyScore, isOverdue, etc.)
5. **Extensible:** Add any frontmatter property → instantly queryable in Bases

### Key Bases Formulas (in default .base files)

```yaml
formulas:
  daysUntilDue: if(due, ((number(date(due)) - number(today())) / 86400000).floor(), null)
  isOverdue: due && date(due) < today() && status != "done"
  urgencyScore: formula.priorityWeight + max(0, 10 - formula.daysUntilNext)
  efficiencyRatio: (timeTracked / timeEstimate * 100).round()
```

### Dataview vs Bases

**For Project Pages (Dataview):**
```dataview
TABLE priority, due, status
FROM "Tasks"
WHERE contains(projects, this.file.link) AND status != "done"
```

**For TaskNotes Views (Bases):**
Views are `.base` files in `TaskNotes/Views/` with filters/sorting/grouping

## Integrations

**Optional HTTP API:** `http://127.0.0.1:8090/api` (requires Obsidian + TaskNotes running)
**CLI:** https://github.com/callumalpass/tasknotes-cli
**Browser Extension:** https://github.com/callumalpass/tasknotes-browser-extension
**Webhooks:** For external service notifications

## Reference

**Official docs:** https://tasknotes.dev  
**GitHub:** https://github.com/callumalpass/tasknotes
**Spec:** One note per task, YAML frontmatter, Markdown body  
**Integration:** Obsidian Bases plugin for views (REQUIRED - enable in Settings → Core Plugins)  
**No API required:** Direct file operations work independently
