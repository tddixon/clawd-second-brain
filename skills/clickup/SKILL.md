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

ClickUp Docs use the **v3 API** at `https://api.clickup.com/api/v3/workspaces/{workspace_id}/docs`.

### Search for Docs

```bash
GET /api/v3/workspaces/{workspace_id}/docs
```

### Create a Doc

```bash
POST /api/v3/workspaces/{workspace_id}/docs

# Create doc in a folder (type 5 = folder)
curl -X POST "https://api.clickup.com/api/v3/workspaces/{workspace_id}/docs" \
  -H "Authorization: {api_key}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Document",
    "parent": {"id": "{folder_id}", "type": 5}
  }'

# Parent types: 5 = folder, 7 = workspace
# Response: {"id": "doc_id", "name": "...", "parent": {...}, ...}
```

### Fetch a Doc

```bash
GET /api/v3/workspaces/{workspace_id}/docs/{doc_id}
```

### Fetch PageListing for a Doc

```bash
GET /api/v3/workspaces/{workspace_id}/docs/{doc_id}/pages
# Returns array of page objects with id, name, content, order_index
```

### Fetch Pages belonging to a Doc

```bash
GET /api/v3/workspaces/{workspace_id}/docs/{doc_id}/pages
```

### Create a Page

```bash
POST /api/v3/workspaces/{workspace_id}/docs/{doc_id}/pages

curl -X POST "https://api.clickup.com/api/v3/workspaces/{workspace_id}/docs/{doc_id}/pages" \
  -H "Authorization: {api_key}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Page Title",
    "content": "Markdown content here"
  }'

# Response: {"id": "page_id", "doc_id": "...", "name": "...", "content": "...", ...}
```

### Get Page

```bash
GET /api/v3/workspaces/{workspace_id}/docs/{doc_id}/pages/{page_id}
```

### Edit a Page

```bash
PUT /api/v3/workspaces/{workspace_id}/docs/{doc_id}/pages/{page_id}

curl -X PUT "https://api.clickup.com/api/v3/workspaces/{workspace_id}/docs/{doc_id}/pages/{page_id}" \
  -H "Authorization: {api_key}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Title",
    "content": "Updated markdown content"
  }'
```

### Important Notes

- **Auto-created page:** Creating a doc auto-creates an "Untitled" first page. Its name may not visually update in the UI even after editing via API.
- **Content format:** Supports markdown in the `content` field.
- **No delete endpoint:** Pages and docs cannot be deleted via API — must use the UI.
- **Parent types:** Use `"type": 5` for folders, `"type": 7` for workspace-level docs.

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
