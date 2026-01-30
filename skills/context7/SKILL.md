---
name: context7
description: |
  Fetch up-to-date library documentation via Context7 API.
  Use PROACTIVELY when: (1) Working with ANY external library (React, Next.js, Supabase, etc.)
  (2) User asks about library APIs, patterns, or best practices
  (3) Implementing features that rely on third-party packages
  (4) Debugging library-specific issues
  (5) Need current documentation beyond training data cutoff
  Always prefer this over guessing library APIs or using outdated knowledge.
---

# Context7 Documentation Fetcher

Retrieve current library documentation via Context7 API.

## Workflow

### 1. Search for the library

```bash
python3 /home/desktop/clawd/skills/context7/scripts/context7.py search "<library-name>"
```

Example:
```bash
python3 /home/desktop/clawd/skills/context7/scripts/context7.py search "next.js"
```

Returns library metadata including the `id` field needed for step 2.

### 2. Fetch documentation context

```bash
python3 /home/desktop/clawd/skills/context7/scripts/context7.py context "<library-id>" "<query>"
```

Example:
```bash
python3 /home/desktop/clawd/skills/context7/scripts/context7.py context "/vercel/next.js" "app router middleware"
```

Options:
- `--type txt|md` - Output format (default: txt)
- `--tokens N` - Limit response tokens

### 3. Alternative: mcporter (MCP)

Context7 is also available via mcporter MCP:

```bash
# Search for a library
mcporter call 'context7.resolve-library-id(query: "how to create docs", libraryName: "clickup")'

# Query docs
mcporter call 'context7.query-docs(libraryId: "/websites/developer_clickup", query: "create doc API endpoint")'
```

## Quick Reference

| Task | Command |
|------|---------|
| Find React docs | `search "react"` |
| Get React hooks info | `context "/facebook/react" "useEffect cleanup"` |
| Find Supabase | `search "supabase"` |
| Get Supabase auth | `context "/supabase/supabase" "authentication row level security"` |
| ClickUp API docs | `context "/websites/developer_clickup" "create doc page"` |

## Known Library IDs

| Library | ID |
|---------|-----|
| ClickUp API | `/websites/developer_clickup` |
| Next.js | `/vercel/next.js` |
| React | `/facebook/react` |
| Supabase | `/supabase/supabase` |
| Convex | `/get-convex/convex` |

## When to Use

- Before implementing any library-dependent feature
- When unsure about current API signatures
- For library version-specific behavior
- To verify best practices and patterns
