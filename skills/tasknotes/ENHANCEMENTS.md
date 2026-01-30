# TaskNotes Enhancement Recommendations

Based on comprehensive review of tasknotes.dev documentation and GitHub repository.

## 🏗️ Architecture Understanding (CRITICAL)

**TaskNotes is built on Obsidian Bases** - This changes everything:

1. **Tasks are just markdown files** - No database, fully portable
2. **Views are .base files** - All views stored in `TaskNotes/Views/` as plain text YAML
3. **Bases = Obsidian's database engine** - Core plugin that reads frontmatter properties
4. **Formula properties** - Computed fields like `urgencyScore`, `isOverdue` in .base files
5. **Fully extensible** - Add any property to tasks → instantly queryable

**What this means for you:**
- ✅ Your tasks work in TaskNotes views AND Dataview queries
- ✅ Can create custom views by duplicating .base files
- ✅ 100% portable - just markdown files
- ✅ No vendor lock-in

**Important:** Bases plugin must be enabled (Settings → Core Plugins → Bases) ✅

## Summary of Key Features We Should Use

### 🎯 Currently Using
- ✅ Basic YAML structure with `tags: [task]`
- ✅ Project linking via wikilinks
- ✅ Status, priority, due dates
- ✅ Contexts for GTD

### 🚀 Recommended to Implement

---

## 1. **Inline Task Widgets** (High Priority)

### What It Is
Interactive task widgets that appear when you link to tasks in any note.

### How It Works
When you write `[[Task Name]]` in any note, it becomes an interactive widget showing:
- Status dot (clickable to change status)
- Priority indicator
- Due date (clickable)
- Quick actions menu

### Benefits
- Manage tasks without opening task files
- See task status at a glance in project notes
- Update tasks inline in daily notes, meeting notes, etc.

### Setup Required
**Settings → TaskNotes → General**
- Enable "Task link overlay"

### Use Case for You
In your project notes like `Nomads-Bangkok-Opening.md`, you could link tasks inline:
```markdown
## This Week
- [[Pay-rose-kb-space]] - Due tomorrow
- [[Confirm-aircon-quotation]] - Waiting on vendor
```

Each becomes an interactive widget you can click to update!

---

## 2. **Body Templates** (High Priority)

### What It Is
Pre-fill task note bodies with standard structure and boilerplate.

### Template Variables Available
```markdown
{{title}} - Task title
{{date}} - Current date
{{parentNote}} - Parent note as wikilink
{{project}} - First project
{{contexts}} - All contexts
{{tags}} - All tags
{{year}}, {{month}}, {{day}} - Date components
{{priorityShort}} - H/M/L
```

### Recommended Template for Your Tasks

```yaml
---
tags:
  - task
title: "{{title}}"
status: open
priority: normal
projects:
  - {{parentNote}}
contexts:
  - "@computer"
---

## Context
*(Why is this task needed?)*

## Steps
1. 
2. 
3. 

## Notes
- 

## Related
- Project: {{parentNote}}
- Created: {{date}}
```

### Benefits
- Consistent structure for all tasks
- Auto-link to parent project via `{{parentNote}}`
- Pre-filled sections prompt better task documentation
- Faster task creation

### Setup Required
**Settings → TaskNotes → Task Properties → Title card**
- Scroll down to find body template settings
- Enable "Use body template"
- Paste template

### Use Case for You
Every task you create for Nomads Bangkok Opening would automatically:
- Link back to the project
- Have sections for Context, Steps, Notes
- Be documented consistently

---

## 3. **Instant Task Conversion** (High Priority)

### What It Is
Convert checkbox tasks or plain text lines into TaskNotes with one click.

### How It Works
In ANY note, write:
```markdown
- [ ] Call vendor about quote
- [ ] Review contract with Edmund
- Meeting action item: Update pricing spreadsheet
```

A "convert" button appears next to each line. Click it:
1. Creates a proper TaskNote file
2. Replaces the line with a wikilink to the task
3. Preserves formatting

### Benefits
- Capture tasks quickly in daily notes, meeting notes
- Convert to proper tasks when ready
- Maintains context (line stays in original note as link)

### Setup Required
**Settings → TaskNotes → Features**
- Enable "Show convert button next to checkboxes"

**Settings → TaskNotes → General**
- Set "Folder for converted tasks" to `{{currentNotePath}}` (same folder as note)
  - Or leave empty to use default Tasks folder
  
**Settings → TaskNotes → Task Properties → Projects card**
- Enable "Use parent note as project" to auto-link tasks to the note they're created from

### Use Case for You
In `Nomads-Bangkok-Opening.md` meeting notes:
```markdown
## Meeting 2026-01-27
- [ ] Get quote from electrician  ← Convert button
- [ ] Schedule inspection  ← Convert button
```

Click convert → Creates tasks automatically linked to Nomads Bangkok Opening!

---

## 4. **Bulk Task Conversion** (Medium Priority)

### What It Is
Convert ALL checkbox tasks in a note to TaskNotes in one command.

### How It Works
Command palette: "Convert all tasks in note to TaskNotes"
- Scans entire note for checkboxes
- Creates TaskNote for each
- Replaces with wikilinks

### Benefits
- Process meeting notes with many action items
- Migrate old notes with checkboxes
- Faster than converting one by one

### Use Case for You
After a big planning meeting with 15 action items, convert them all at once instead of clicking 15 times.

---

## 5. **Natural Language Processing** (High Priority)

### What It Is
Create tasks by typing natural language descriptions.

### Syntax

```
Buy groceries tomorrow at 3pm @home #errands high priority

Parses to:
- title: "Buy groceries"
- scheduled: tomorrow at 3pm
- contexts: ["@home"]
- tags: ["task", "errands"]
- priority: high
```

### Supported Patterns
- **Dates:** tomorrow, next Friday, in 3 days, Jan 15
- **Times:** at 3pm, 9:00 AM
- **Contexts:** @office, @phone, @home
- **Tags:** #urgent, #meeting
- **Projects:** +[[Project Name]]
- **Priority:** high priority, low priority
- **Status:** *in-progress, *done (configurable trigger)

### Benefits
- Faster task creation
- Natural way to capture
- Auto-extracts metadata

### Setup Required
**Already enabled by default**, but customize:

**Settings → TaskNotes → Features → NLP Triggers**
- Customize trigger characters (default: @ for context, # for tags, + for projects)
- Enable priority trigger (default: ! disabled)
- Enable status trigger (default: *)

### Use Case for You
Type in task creation modal:
```
Pay rose/kb space tomorrow @computer +[[Nomads-Bangkok-Opening]] high
```

Auto-fills:
- Due: 2026-01-28
- Context: @computer
- Project: Nomads Bangkok Opening
- Priority: high

---

## 6. **Relationships Widget** (Medium Priority)

### What It Is
Auto-generated widget showing related tasks in the task note itself.

### Displays
- **Subtasks:** Tasks that link to this task as a project
- **Projects:** Projects this task belongs to
- **Blocked By:** Dependencies blocking this task
- **Blocking:** Tasks this task is blocking

### Benefits
- See task relationships at a glance
- Kanban view for subtasks
- Manage dependencies visually

### Setup Required
**Settings → TaskNotes → Misc Settings**
- Enable "Show Relationships Widget"
- Choose position (top or bottom of note)

### Use Case for You
In a major task like "Launch Bangkok Location", the widget would automatically show all sub-tasks as a Kanban board inside the task note.

---

## 7. **Default Reminders** (Low Priority)

### What It Is
Automatically add reminders to new tasks.

### Examples
- 1 day before due date
- 15 minutes before scheduled time
- Specific date/time

### Setup Required
**Settings → TaskNotes → Task Properties → Reminders card**
- Add default reminders

### Use Case for You
All tasks with due dates automatically get a 1-day-before reminder.

---

## 8. **Custom User Fields** (Medium Priority)

### What It Is
Add custom properties to tasks beyond the standard fields.

### Examples for Your Business
```yaml
assignee: "John Doe"
client: "Nomads"
location: "Bangkok"
budget: 5000
vendor: "ABC Supplies"
```

### Benefits
- Track business-specific data
- Filter/sort by custom fields
- Better organization

### Setup Required
**Settings → TaskNotes → Task Properties → Custom User Fields**
- Add new field
- Set field name, type (text/number/date/list)
- Optional: NLP trigger

### Use Case for You
Track which staff member is responsible:
```yaml
assignee: "Edmund"
location: "Bangkok"
budget: 15000
```

---

## 9. **Task Dependencies** (Low Priority for Now)

### What It Is
Define task relationships (this blocks that, etc.)

### Format
```yaml
blockedBy:
  - uid: "[[Order hardware]]"
    reltype: FINISHTOSTART
    gap: P1D  # 1 day gap
```

### Benefits
- Visual dependency tracking
- Prevent starting tasks before prerequisites done
- Project planning

### Use Case for You
"Install aircon" blocked by "Confirm aircon quotation"

---

## 10. **Recurring Tasks** (Low Priority for Now)

### What It Is
Tasks that repeat on a schedule.

### Format
```yaml
recurrence: "DTSTART:20260804T090000Z;FREQ=DAILY"
scheduled: "2026-08-04T09:00"
```

### Examples
- Daily: Check reservations
- Weekly: Staff meeting notes
- Monthly: Financial report

### Use Case for You
Monthly accounting tasks, weekly operations check-ins.

---

## 🎯 Recommended Implementation Order

### Phase 1: Quick Wins (This Week)
1. ✅ **Enable inline task widgets** - 5 minutes setup, immediate value
2. ✅ **Set up body template** - 10 minutes, consistent structure
3. ✅ **Enable instant task conversion** - 5 minutes, faster capture

### Phase 2: Workflow Enhancement (Next Week)
4. ✅ **Configure NLP properly** - Better task creation experience
5. ✅ **Add custom fields** - Track assignee, location, budget
6. ✅ **Enable relationships widget** - See task connections

### Phase 3: Advanced Features (As Needed)
7. ⏰ **Set up default reminders** - When you need notifications
8. ⏰ **Use dependencies** - For complex project planning
9. ⏰ **Add recurring tasks** - For ongoing operations

---

## 🛠️ Immediate Action Items

### 1. Update TaskNotes Skill
Add these features to `/home/desktop/clawd/skills/tasknotes/SKILL.md`:
- Body template variables
- Instant conversion workflow
- NLP patterns
- Custom fields

### 2. Configure Your Obsidian
Open TaskNotes settings and enable:
- Task link overlays
- Instant task conversion
- Body template (with recommended template above)
- Use parent note as project

### 3. Test Workflow
Try this flow:
1. Open `Nomads-Bangkok-Opening.md`
2. Write: `- [ ] Test task for conversion`
3. Click convert button
4. Verify: Task created, linked to project automatically
5. Type task wikilink elsewhere, see widget appear

---

## 📋 Template to Use Right Now

**Copy this to TaskNotes settings:**

```markdown
## Context
*(Why is this task needed?)*

## Steps
1. 
2. 
3. 

## Notes
- 

## Progress Log
- {{date}} - Task created

## Related
- Project: {{parentNote}}
```

This gives structure to every task without being overwhelming.

---

## Questions?

1. **Do you want me to update the TaskNotes skill with all these features?**
2. **Should I create a setup guide for configuring your Obsidian settings?**
3. **Want me to create example tasks using the new features?**

Let me know what you'd like to implement first! 🚀
