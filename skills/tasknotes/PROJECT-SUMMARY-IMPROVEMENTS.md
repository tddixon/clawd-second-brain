# Project Summary Page Improvements

Comprehensive guide for creating powerful project summary pages that integrate TaskNotes tasks with rich Dataview queries.

## 🎯 What Changed

### Before (Basic)
```dataview
TABLE priority, due, status
FROM "Tasks"
WHERE contains(projects, this.file.link) AND status != "done"
```

### After (Enhanced)
- ✅ Visual priority indicators (🔴 🟡 🟢)
- ✅ Clickable task links
- ✅ Multiple filtered views (High Priority, Due This Week, In Progress)
- ✅ Urgency indicators (🚨 OVERDUE, 📍 TODAY)
- ✅ Task statistics summary
- ✅ Time estimates displayed
- ✅ Better sorting

---

## 📋 Enhanced Query Patterns

### 1. **Clickable Task Links**

**Pattern:**
```dataview
TABLE WITHOUT ID
  ("[[" + file.name + "|" + title + "]]") as Task
FROM "Tasks"
WHERE contains(projects, this.file.link)
```

**What it does:**
- Creates wikilink to task file
- Shows task title as link text
- Clicking opens task in TaskNotes

**Result:** `[[Pay-rose-kb-space|Pay rose/kb space]]`

---

### 2. **Visual Priority Indicators**

**Pattern:**
```dataview
TABLE WITHOUT ID
  choice(priority = "high", "🔴", choice(priority = "normal", "🟡", "🟢")) as "!"
FROM "Tasks"
WHERE contains(projects, this.file.link)
```

**Visual:**
- 🔴 High priority
- 🟡 Normal priority
- 🟢 Low priority

---

### 3. **Urgency Status**

**Pattern:**
```dataview
TABLE WITHOUT ID
  choice(date(due) < date(today), "🚨 OVERDUE", 
    choice(date(due) = date(today), "📍 TODAY", "📅 Upcoming")) as Urgency
FROM "Tasks"
WHERE due >= date(today) - dur(1 day)
```

**Visual:**
- 🚨 OVERDUE
- 📍 TODAY
- 📅 Upcoming

---

### 4. **Due This Week Filter**

**Pattern:**
```dataview
FROM "Tasks"
WHERE contains(projects, this.file.link)
  AND due >= date(today) - dur(1 day)
  AND due <= date(today) + dur(7 days)
```

**Shows:**
- Overdue tasks (yesterday onwards)
- Today's tasks
- Next 7 days

---

### 5. **Task Statistics**

**Pattern:**
```dataview
TABLE WITHOUT ID
  length(filter(rows.file.link, (x) => contains(x.status, "done"))) as "✅ Completed",
  length(filter(rows.file.link, (x) => contains(x.status, "in-progress"))) as "🔄 In Progress",
  length(filter(rows.file.link, (x) => contains(x.status, "open"))) as "📋 Open"
FROM "Tasks"
WHERE contains(projects, this.file.link)
GROUP BY "Project Tasks"
```

**Result:**
```
Project Tasks | ✅ Completed | 🔄 In Progress | 📋 Open
--------------|--------------|----------------|--------
              | 5            | 2              | 8
```

---

## 🎨 Complete Enhanced Template

### Full Project Summary Structure

```markdown
---
title: "Project Name"
created: YYYY-MM-DDTHH:mm:ss
type: project
status: active
priority: high
areas: ["[[Area Name]]"]
tags:
  - project
---

# Project Name

Brief description of project.

## 🎯 Desired Outcome

Clear definition of what "done" looks like.

---

## 📋 Task Overview

### ⚡ High Priority Tasks

```dataview
TABLE WITHOUT ID
  ("[[" + file.name + "|" + title + "]]") as Task,
  priority as Priority,
  due as "Due Date",
  contexts as Contexts,
  timeEstimate as "Est (min)"
FROM "Tasks"
WHERE contains(projects, this.file.link) 
  AND status != "done" 
  AND priority = "high"
SORT due ASC
```

### 📌 Open Tasks (All)

```dataview
TABLE WITHOUT ID
  ("[[" + file.name + "|" + title + "]]") as Task,
  choice(priority = "high", "🔴", choice(priority = "normal", "🟡", "🟢")) as "!",
  status as Status,
  due as Due,
  scheduled as Scheduled,
  contexts as Context,
  timeEstimate as "Time"
FROM "Tasks"
WHERE contains(projects, this.file.link) AND status != "done"
SORT priority DESC, due ASC, scheduled ASC
```

### ⏳ Due This Week

```dataview
TABLE WITHOUT ID
  ("[[" + file.name + "|" + title + "]]") as Task,
  due as "Due Date",
  choice(date(due) < date(today), "🚨 OVERDUE", 
    choice(date(due) = date(today), "📍 TODAY", "📅 Upcoming")) as Urgency
FROM "Tasks"
WHERE contains(projects, this.file.link) 
  AND status != "done"
  AND due >= date(today) - dur(1 day)
  AND due <= date(today) + dur(7 days)
SORT due ASC
```

### 🔄 In Progress

```dataview
TABLE WITHOUT ID
  ("[[" + file.name + "|" + title + "]]") as Task,
  due as Due,
  timeEstimate as "Est Time (min)"
FROM "Tasks"
WHERE contains(projects, this.file.link) AND status = "in-progress"
SORT file.mtime DESC
```

---

## ⏸️ Waiting On

*(Manual section - list blocking items)*

**Format:** `- Person/Vendor - What (asked: date, follow-up: date)`

Example:
- Legal team - Contract review (asked: 2026-01-25, follow up: 2026-01-30)
- Vendor - Final quote (asked: 2026-01-26, follow up: 2026-01-28)

---

## ✅ Recently Completed

```dataview
TABLE WITHOUT ID
  ("[[" + file.name + "|" + title + "]]") as Task,
  file.mtime as "Completed",
  timeEstimate as "Est Time"
FROM "Tasks"
WHERE contains(projects, this.file.link) AND status = "done"
SORT file.mtime DESC
LIMIT 10
```

---

## 📊 Task Statistics

```dataview
TABLE WITHOUT ID
  rows.file.link as "Total Tasks",
  length(filter(rows.file.link, (x) => contains(x.status, "done"))) as "✅ Completed",
  length(filter(rows.file.link, (x) => contains(x.status, "in-progress"))) as "🔄 In Progress",
  length(filter(rows.file.link, (x) => contains(x.status, "open"))) as "📋 Open"
FROM "Tasks"
WHERE contains(projects, this.file.link)
GROUP BY "Project Tasks"
```

---

## 📝 Notes

```dataview
LIST
FROM "Projects/Your-Project/Notes"
SORT file.mtime DESC
```

---

## 📚 References

```dataview
LIST
FROM "Projects/Your-Project/References"
SORT file.mtime DESC
```

---

## 💡 Someday/Maybe

*(Future ideas not committed to current scope)*

---

## 🔗 Links

- **Parent Project:** [[Parent]]
- **Area:** [[Area]]
- **Related:** [[Related Project 1]], [[Related Project 2]]
```

---

## 🎯 Specific Improvements Made

### For Nomads Bangkok Opening:

**Added:**
1. ✅ Visual priority indicators (🔴 🟡 🟢)
2. ✅ Clickable task links that open in TaskNotes
3. ✅ High Priority section (filtered view)
4. ✅ Due This Week section with urgency indicators
5. ✅ In Progress section
6. ✅ Task statistics summary
7. ✅ Time estimates displayed
8. ✅ Better emoji indicators throughout
9. ✅ Improved sorting (priority → due → scheduled)

**Enhanced queries show:**
- Task title as clickable link
- Priority visual indicator
- Status
- Due date
- Scheduled date
- Context tags
- Time estimate

---

## 📝 Task Body Template Recommendations

### Standard Task Structure

```markdown
---
tags:
  - task
title: "Task title"
status: open
priority: normal
contexts:
  - "@context"
projects:
  - "[[Project]]"
timeEstimate: 30
---

## Context

*(Why is this task needed? What's the background?)*

## Steps

1. First step
2. Second step
3. Third step

## Notes

- Key point 1
- Key point 2

## Related

- Project: [[Project Name]]
- Related tasks: [[Other Task]]
```

**Benefits:**
- Consistent structure
- Clear steps for execution
- Context preserved
- Easy to review
- Better documentation

---

## 🔄 Advanced Query Patterns

### 1. **Tasks by Context**

```dataview
TABLE WITHOUT ID
  ("[[" + file.name + "|" + title + "]]") as Task,
  due as Due
FROM "Tasks"
WHERE contains(projects, this.file.link)
  AND contains(contexts, "@computer")
  AND status != "done"
SORT due ASC
```

### 2. **Tasks by Assignee** (if using custom field)

```dataview
TABLE WITHOUT ID
  ("[[" + file.name + "|" + title + "]]") as Task,
  assignee as "Assigned To",
  due as Due
FROM "Tasks"
WHERE contains(projects, this.file.link)
  AND status != "done"
GROUP BY assignee
SORT assignee ASC
```

### 3. **Budget Tracking** (if using custom field)

```dataview
TABLE WITHOUT ID
  ("[[" + file.name + "|" + title + "]]") as Task,
  budget as Budget,
  status as Status
FROM "Tasks"
WHERE contains(projects, this.file.link)
  AND budget > 0
SORT budget DESC
```

### 4. **Time Tracking Summary**

```dataview
TABLE WITHOUT ID
  sum(rows.timeEstimate) as "Total Est (min)",
  sum(rows.timeEstimate) / 60 as "Total Est (hours)"
FROM "Tasks"
WHERE contains(projects, this.file.link)
  AND status != "done"
```

---

## 🎨 Visual Enhancements

### Emoji Guide

**Priority:**
- 🔴 High
- 🟡 Normal
- 🟢 Low

**Status:**
- ✅ Done
- 🔄 In Progress
- 📋 Open
- ⏸️ Waiting
- ❌ Dropped

**Urgency:**
- 🚨 OVERDUE
- 📍 TODAY
- 📅 Upcoming
- ⏰ This Week

**Sections:**
- 🎯 Goals/Outcomes
- ⚡ High Priority
- 📋 Tasks
- 📊 Statistics
- 📝 Notes
- 📚 References
- 💡 Ideas
- 🔗 Links

---

## 🚀 Implementation Tips

### 1. **Start Simple**

Begin with basic queries and add complexity as needed:
```dataview
TABLE priority, due, status
FROM "Tasks"
WHERE contains(projects, this.file.link)
```

Then enhance:
```dataview
TABLE WITHOUT ID
  ("[[" + file.name + "|" + title + "]]") as Task,
  priority as "!",
  due as Due
FROM "Tasks"
WHERE contains(projects, this.file.link)
```

### 2. **Test Queries**

Use Dataview's inline queries to test:
```
`= length(this.file.tasks)` tasks in this file
```

### 3. **Copy-Paste Template**

Create a project template file with all enhanced queries, then copy for new projects.

### 4. **Customize per Project**

Not every project needs every section. Keep what's useful:
- Small projects: Basic open tasks + completed
- Large projects: Full enhanced template
- Technical projects: Add custom fields (assignee, component, etc.)

---

## 📋 Quick Reference

### Most Useful Queries

**1. Open tasks with clickable links:**
```dataview
TABLE WITHOUT ID
  ("[[" + file.name + "|" + title + "]]") as Task,
  due as Due
FROM "Tasks"
WHERE contains(projects, this.file.link) AND status != "done"
```

**2. High priority tasks:**
```dataview
FROM "Tasks"
WHERE contains(projects, this.file.link) 
  AND priority = "high" 
  AND status != "done"
```

**3. Due soon:**
```dataview
FROM "Tasks"
WHERE contains(projects, this.file.link)
  AND due <= date(today) + dur(3 days)
  AND status != "done"
```

---

## ✅ Checklist for New Projects

When creating a new project summary page:

- [ ] Add 🎯 Desired Outcome section
- [ ] Include enhanced task queries with clickable links
- [ ] Add visual priority indicators
- [ ] Create "Due This Week" filtered view
- [ ] Add task statistics section
- [ ] Include Notes/ and References/ folders
- [ ] Link to parent project and area
- [ ] Add Someday/Maybe section for future ideas
- [ ] Test all Dataview queries render correctly

---

## 🎓 Next Level: Bases Integration

Once comfortable with Dataview, explore creating custom `.base` views in TaskNotes for even more powerful task management:

1. **Kanban boards** per project
2. **Calendar views** for scheduling
3. **Formula properties** for computed fields
4. **Custom grouping** and filtering

See TaskNotes documentation for `.base` file creation.

---

**All improvements are live in:** `Nomads-Bangkok-Opening.md`

**Apply to other projects:** Copy structure to Nomads-Accounting, Nomads-Marketing, Bamboo, etc.
