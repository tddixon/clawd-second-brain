---
name: clickup
description: Interact with ClickUp project management platform via REST API. Use when working with tasks, spaces, lists, assignees, or any ClickUp workflow automation. Handles pagination, subtasks, and common query patterns. Use for task management, reporting, automation, or any ClickUp-related queries.
---

# ClickUp Skill

Interact with ClickUp's REST API for task management, reporting, and workflow automation.

## Configuration

Before using this skill, ensure the following are configured in `TOOLS.md`:

- **API Token:** `CLICKUP_API_KEY`
- **Team/Workspace ID:** `CLICKUP_TEAM_ID`
- **Space IDs** (optional, for filtering)
- **List IDs** (optional, for creating tasks)

## Quick Start

### Using the Helper Script

The fastest way to query ClickUp:

```bash
# Set environment variables
export CLICKUP_API_KEY="pk_..."
export CLICKUP_TEAM_ID="90161392624"

# Get all open tasks
./scripts/clickup-query.sh tasks

# Get task counts (parent vs subtasks)
./scripts/clickup-query.sh task-count

# Get assignee breakdown
./scripts/clickup-query.sh assignees

# Get specific task
./scripts/clickup-query.sh task <task-id>
```

### Direct API Calls

For custom queries or operations not covered by the helper script:

```bash
# Get all open tasks (with subtasks and pagination)
curl "https://api.clickup.com/api/v2/team/{team_id}/task?include_closed=false&subtasks=true" \
  -H "Authorization: {api_key}"
```

## Critical Rules

### 1. ALWAYS Include Subtasks

**Never** query tasks without `subtasks=true`:

```bash
# ✅ CORRECT
?subtasks=true

# ❌ WRONG
(no subtasks parameter)
```

**Why:** Without this parameter, you miss potentially 70%+ of actual tasks. Parent tasks are just containers; real work happens in subtasks.

### 2. Handle Pagination

ClickUp API returns max 100 tasks per page. **Always** loop until `last_page: true`:

```bash
page=0
while true; do
    result=$(curl -s "...&page=$page" -H "Authorization: $CLICKUP_API_KEY")
    
    # Process tasks
    echo "$result" | jq '.tasks[]'
    
    # Check if done
    is_last=$(echo "$result" | jq -r '.last_page')
    [ "$is_last" = "true" ] && break
    
    ((page++))
done
```

**Why:** Workspaces with 300+ tasks need 3-4 pages. Missing pages = incomplete data.

### 3. Distinguish Parent Tasks vs Subtasks

```bash
# Parent tasks have parent=null
jq '.tasks[] | select(.parent == null)'

# Subtasks have parent != null
jq '.tasks[] | select(.parent != null)'
```

## Common Operations

### Get Task Counts

```bash
# Using helper script (recommended)
./scripts/clickup-query.sh task-count

# Direct API with jq
curl -s "https://api.clickup.com/api/v2/team/{team_id}/task?subtasks=true" \
  -H "Authorization: {api_key}" | \
jq '{
    total: (.tasks | length),
    parents: ([.tasks[] | select(.parent == null)] | length),
    subtasks: ([.tasks[] | select(.parent != null)] | length)
}'
```

### Get Assignee Breakdown

```bash
# Using helper script (recommended)
./scripts/clickup-query.sh assignees

# Direct API
curl -s "https://api.clickup.com/api/v2/team/{team_id}/task?subtasks=true" \
  -H "Authorization: {api_key}" | \
jq -r '.tasks[] | 
    if .assignees and (.assignees | length) > 0 
    then .assignees[0].username 
    else "Unassigned" 
    end' | sort | uniq -c | sort -rn
```

### Create a Task

```bash
curl "https://api.clickup.com/api/v2/list/{list_id}/task" \
  -X POST \
  -H "Authorization: {api_key}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Task Name",
    "description": "Description here",
    "assignees": [user_id],
    "status": "to do",
    "priority": 3
  }'
```

### Update a Task

```bash
curl "https://api.clickup.com/api/v2/task/{task_id}" \
  -X PUT \
  -H "Authorization: {api_key}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "status": "in progress",
    "priority": 2
  }'
```

### Get Specific Task

```bash
# Using helper script
./scripts/clickup-query.sh task {task_id}

# Direct API
curl "https://api.clickup.com/api/v2/task/{task_id}" \
  -H "Authorization: {api_key}"
```

## Advanced Queries

### Filter by Space

```bash
curl "https://api.clickup.com/api/v2/team/{team_id}/task?space_ids[]={space_id}&subtasks=true" \
  -H "Authorization: {api_key}"
```

### Filter by List

```bash
curl "https://api.clickup.com/api/v2/list/{list_id}/task?subtasks=true" \
  -H "Authorization: {api_key}"
```

### Include Closed Tasks

```bash
curl "https://api.clickup.com/api/v2/team/{team_id}/task?include_closed=true&subtasks=true" \
  -H "Authorization: {api_key}"
```

## Docs API (v3)

Base URL: `https://api.clickup.com/api/v3/workspaces/{workspace_id}`

### Parent Types

| Type | Entity |
|------|--------|
| 4 | Space |
| 5 | Folder |
| 6 | List |
| 7 | All |
| 12 | Workspace |

### Search for Docs

```bash
GET /docs

# Optional query params: id, creator, deleted, archived, parent_id, parent_type, limit, next_cursor
curl -s "https://api.clickup.com/api/v3/workspaces/{workspace_id}/docs?parent_id={folder_id}&parent_type=5" \
  -H "Authorization: {api_key}"
```

### Create a Doc

```bash
POST /docs

curl -X POST "https://api.clickup.com/api/v3/workspaces/{workspace_id}/docs" \
  -H "Authorization: {api_key}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Document",
    "parent": {"id": "{folder_id}", "type": 5},
    "visibility": "PUBLIC",
    "create_page": false
  }'

# Parameters:
#   name (required): Document name
#   parent: {id, type} - where to place the doc (see Parent Types)
#   visibility: "PUBLIC" | "PRIVATE"
#   create_page: boolean - set false to avoid auto-created "Untitled" page
#
# Response: {"id": "doc_id", "name": "...", "parent": {...}, ...}
```

### Fetch a Doc

```bash
GET /docs/{doc_id}
```

### Fetch PageListing for a Doc

```bash
GET /docs/{doc_id}/pages

# Returns array of page objects with id, name, content, order_index
# Optional: max_page_depth (-1 for unlimited)
```

### Create a Page

```bash
POST /docs/{doc_id}/pages

curl -X POST "https://api.clickup.com/api/v3/workspaces/{workspace_id}/docs/{doc_id}/pages" \
  -H "Authorization: {api_key}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Page Title",
    "sub_title": "Optional subtitle",
    "content": "Markdown content here",
    "parent_page_id": "optional_parent_page_id"
  }'

# Parameters:
#   name (required): Page title
#   content: Markdown content (max 2MB)
#   sub_title: Optional subtitle
#   parent_page_id: Nest under another page (for hierarchy)
#
# Response: {"id": "page_id", "doc_id": "...", "name": "...", "content": "...", ...}
```

### Get Page

```bash
GET /docs/{doc_id}/pages/{page_id}

# Optional: content_format = "text/md" | "text/html"
```

### Edit a Page

```bash
PUT /docs/{doc_id}/pages/{page_id}

curl -X PUT "https://api.clickup.com/api/v3/workspaces/{workspace_id}/docs/{doc_id}/pages/{page_id}" \
  -H "Authorization: {api_key}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Title",
    "sub_title": "Updated subtitle",
    "content": "Updated markdown content",
    "content_edit_mode": "replace"
  }'

# Parameters:
#   name: Page title
#   sub_title: Subtitle
#   content: Page content (max 2MB)
#   content_format: "text/md" | "text/plain"
#   content_edit_mode: "replace" (default) | "append" | "prepend"
```

### Important Notes

- **Avoid "Untitled" page:** Set `"create_page": false` when creating a doc, then create your own first page.
- **Content format:** Supports markdown in the `content` field.
- **Content edit modes:** Use `append` or `prepend` to add content without replacing.
- **Nested pages:** Use `parent_page_id` to create page hierarchy (max recommended depth: 5).
- **No delete endpoint:** Pages and docs cannot be deleted via API — must use the UI.
- **Limits:** 2MB per page, 1000 pages per doc, 100 requests/min rate limit.

## Reference Documentation

For detailed API documentation, query patterns, and troubleshooting:

**Read:** `references/api-guide.md`

Covers:
- Full API endpoint reference
- Response structure details
- Common gotchas and solutions
- Rate limits and best practices
- Task object schema

## Workflow Patterns

### Daily Standup Report

```bash
# Get all open tasks grouped by assignee
./scripts/clickup-query.sh assignees

# Get specific team member's tasks
./scripts/clickup-query.sh tasks | \
  jq '.tasks[] | select(.assignees[0].username == "user@example.com")'
```

### Task Audit

```bash
# Count tasks by status
./scripts/clickup-query.sh tasks | \
  jq -r '.tasks[].status.status' | sort | uniq -c | sort -rn

# Find unassigned tasks
./scripts/clickup-query.sh tasks | \
  jq '.tasks[] | select(.assignees | length == 0)'
```

### Priority Analysis

```bash
# Count by priority
./scripts/clickup-query.sh tasks | \
  jq -r '.tasks[] | .priority.priority // "none"' | sort | uniq -c | sort -rn
```

## Tips

- **Helper script first:** Use `scripts/clickup-query.sh` for common operations
- **Direct API for custom:** Use curl when you need specific filters or updates
- **Always read api-guide.md:** Contains full endpoint reference and troubleshooting
- **Check TOOLS.md:** For workspace-specific IDs and configuration
- **Test with small queries:** When unsure, test with `| head -n 5` first

## Troubleshooting

- **Missing tasks?** → Add `subtasks=true`
- **Only 100 tasks returned?** → Implement pagination loop
- **401 Unauthorized?** → Check `CLICKUP_API_KEY` is set correctly
- **Rate limit error?** → Wait 1 minute (100 requests/min limit)
- **Empty assignees array?** → Task is unassigned (not an error)
