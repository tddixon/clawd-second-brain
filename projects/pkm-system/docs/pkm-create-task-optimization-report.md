# PKM Create Task - Optimization Report

**Date:** 2026-01-26
**Skill:** pkm-create-task
**Status:** Analysis Complete

---

## Executive Summary

The `pkm-create-task` skill provides a robust framework for creating tasks across ClickUp, Todoist, and Obsidian with intelligent routing and flexible date handling. However, several optimization opportunities exist around error handling, MCP integration, batch operations, and duplicate detection.

**Key Findings:**
- ✅ **Strong foundation:** Well-structured with dual MCP/direct API approach
- ⚠️ **Error handling:** Basic error messages, no retry logic or rate limit handling
- ⚠️ **MCP integration:** Documented but not implemented with fallback patterns
- ⚠️ **Time defaults:** Inconsistent time parsing logic (bugs in regex)
- ❌ **Missing features:** No batch operations, duplicate detection, or project auto-creation
- ✅ **Wiki-links:** Good integration with Obsidian projects and areas

---

## Current State Analysis

### 1. Integration Points ✅ GOOD

**ClickUp Integration:**
- Primary API via `clickup-api.ts` (TypeScript)
- Supports: tasks, lists, folders, spaces
- MCP-first approach with direct API fallback
- Good coverage of core CRUD operations

**Todoist Integration:**
- Secondary API via `todoist-api.ts` (TypeScript)
- Used for quick capture (inbox-only)
- Natural language date parsing via `due_string`
- Good for personal tasks without project context

**Obsidian Integration:**
- Tasks written to project `_summary.md` files
- Wiki-links to projects and areas
- Obsidian Tasks format with emojis and tags
- Linking to ClickUp tasks via `[CU-xxxxx]`

**Rating:** 8/10 - Solid integration, but Todoist is underutilized

---

### 2. API Coverage ⚠️ MODERATE

**ClickUp API - What's Used:**
- ✅ Create tasks
- ✅ Update tasks
- ✅ Get tasks (by list, with filters)
- ✅ Get spaces/folders/lists
- ✅ Task priorities

**ClickUp API - What's Missing:**
- ❌ **Subtasks** - Not supported but available in API
- ❌ **Custom fields** - No usage, but available
- ❌ **Time tracking** - `time_estimate` and `time_spent` not set
- ❌ **Comments** - No comment creation on tasks
- ❌ **Attachments** - No file attachment support
- ❌ **Dependencies** - `dependencies` field not used
- ❌ **Assignees** - No automatic assignee detection
- ❌ **Tags** - Tags mentioned but not consistently applied
- ❌ **Checklists** - Not using ClickUp checklist feature

**Todoist API - What's Used:**
- ✅ Create tasks
- ✅ Get tasks (basic)
- ✅ Get projects
- ✅ Inbox tasks

**Todoist API - What's Missing:**
- ❌ **Labels** - Not using labels (equivalent to tags)
- ❌ **Reminders** - No reminder creation
- ❌ **Comments** - No task comments
- ❌ **Projects** - No project creation beyond inbox

**Rating:** 6/10 - Core features covered, but missing many ClickUp capabilities

---

### 3. Error Handling ❌ WEAK

**Current Implementation:**
```javascript
try {
  const mcpResult = await callTool('claude_clickup', {...});
  return { success: true, ... };
} catch (mcpError) {
  console.log('MCP unavailable, using direct API');
  return await createTaskDirectly(listId, params);
}
```

**Issues:**
1. **No error classification** - Distinguishing between network errors, auth errors, rate limits
2. **No retry logic** - Single attempt only
3. **No rate limit handling** - ClickUp has 100 req/min limit, Todoist 50 req/min
4. **Generic error messages** - "ClickUp API error: 400" isn't user-friendly
5. **No validation** - Doesn't check if list ID exists before creating
6. **No timeout handling** - No timeout on API calls (could hang)
7. **Silent failures** - MCP fallback may mask the real issue

**What Should Happen:**
```javascript
async function createTaskWithRetry(listId, params, maxRetries = 3) {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await createTaskDirectly(listId, params);
    } catch (error) {
      lastError = error;

      // Rate limit - wait and retry
      if (error.status === 429) {
        const waitTime = error.retryAfter || 1000 * Math.pow(2, i);
        await sleep(waitTime);
        continue;
      }

      // Auth error - don't retry
      if (error.status === 401 || error.status === 403) {
        throw new Error(`API authentication failed. Check your API token.`);
      }

      // Network error - retry
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        await sleep(1000 * Math.pow(2, i));
        continue;
      }

      // Other errors - don't retry
      throw error;
    }
  }

  throw lastError;
}
```

**Rating:** 3/10 - Basic try/catch, but no resilience

---

### 4. Time/Date Logic ⚠️ MODERATE (WITH BUGS)

**Current Implementation:**
The `parseSmartDueDate()` function attempts to parse various date formats, but has bugs:

**Bug #1: Incorrect regex group access**
```javascript
// Current (BROKEN)
const [time, period] = options.due_date.match(/today at (\d+)(pm|am)/);
const hour = parseInt(time[1]);  // ❌ BUG: time[1] is undefined, time is array

// Correct
const match = options.due_date.match(/today at (\d+)(pm|am)/);
const hour = parseInt(match[1]);  // ✅ Use match[1]
```

**Bug #2: Hardcoded time values**
```javascript
// Current
now.setHours(period === 'am' ? 11 : 14 + (period === 'am' ? 0 : 12));  // ❌ Confusing

// Intended (but still buggy)
// period === 'am' → 11am
// period === 'pm' → 14 + 12 = 26 (WRONG!) - should be hour + 12
```

**Bug #3: `tomorrow.setDate()` doesn't work as expected**
```javascript
// Current
const tomorrow = new Date();
return tomorrow.setDate(tomorrow.getDate() + 1).getTime();  // ❌ setDate returns ms, then getTime called on number

// Correct
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
return tomorrow.getTime();
```

**Time Defaults Analysis:**
| Keyword | Current Default | Recommended |
|---------|----------------|-------------|
| "today" | 11am | 9am (start of work day) |
| "tomorrow" | 9am | 9am ✓ |
| "today at Xpm" | Broken | Hour + 12 |
| "today at Xam" | 11am (hardcoded) | Use actual hour |

**ClickUp Date Format:**
- `due_date`: Unix timestamp in **milliseconds** (not seconds!)
- `due_date_time`: Boolean flag - if true, time matters; if false, it's a date only

**Recommendations:**
1. Fix regex bugs
2. Use a proper date parsing library (date-fns or dayjs)
3. Support more natural language ("next Monday", "in 3 days")
4. Add timezone handling
5. Make time defaults configurable per user

**Rating:** 4/10 - Good intention, but implementation has critical bugs

---

### 5. Area-Based Routing ✅ GOOD

**Current Syntax:**
```
"under Nomads > Finance"
```

**Implementation:**
```javascript
function parseAreaSyntax(areaSpec) {
  const match = areaSpec.match(/^under (.+?) > (.+?)$/i);
  if (!match) return null;

  const mainArea = match[1].trim().toLowerCase();
  const subArea = match[2].trim().toLowerCase();

  return { mainArea, subArea };
}
```

**Strengths:**
- Clear, intuitive syntax
- Case-insensitive
- Flexible main area and sub area extraction
- Good keyword mapping for projects

**Issues:**
1. **No validation** - Doesn't check if area exists in Obsidian
2. **Project mapping is hardcoded** - Would be better as config
3. **No auto-creation** - If project folder doesn't exist, fails silently
4. **Limited to one level** - "Area > SubArea > Project" not supported

**Example Usage:**
```
User: "Add task: Review budget under Nomads > Finance"

Parses to:
- mainArea: "nomads"
- subArea: "finance"

Routes to:
- ClickUp List: "Month End Accounting" (via keyword match "finance")
- Obsidian Link: [[2-Areas/Nomads]]
- Project: Month End Accounting
```

**Rating:** 8/10 - Well-designed, but needs validation and auto-creation

---

### 6. MCP Integration ❌ NOT FULLY IMPLEMENTED

**Documentation Claims:**
```
**SMART APPROACH:** Try Claude's ClickUp MCP server first
(more powerful queries, automation). If MCP unavailable or fails,
fall back to direct ClickUp API.
```

**Reality:**
- MCP server URL documented: `clickup://mcp`
- MCP usage mentioned in comments
- **BUT:** No actual MCP tool calling code exists
- No MCP server configuration in workspace
- No MCP client setup

**What's Missing:**
1. **MCP client initialization** - How to connect to `clickup://mcp`
2. **MCP tool definition** - What tools does the ClickUp MCP provide?
3. **MCP tool calling** - How to invoke MCP tools from the skill
4. **Error handling** - How to detect MCP unavailability and fall back
5. **Method tracking** - `[mcp]` vs `[direct]` tags mentioned but not used

**Implementation Needed:**
```javascript
// MCP client setup (pseudo-code)
const mcpClient = new MCPClient({
  serverUrl: "clickup://mcp"
});

async function createTaskMCP(listId, params) {
  try {
    const result = await mcpClient.callTool('create_task', {
      list_id: listId,
      ...params
    });
    return {
      success: true,
      taskId: result.id,
      method: 'mcp'
    };
  } catch (error) {
    if (error.isMCPUnavailable || error.isNetworkError) {
      // Fall back to direct API
      return await createTaskDirectly(listId, params);
    }
    throw error;
  }
}
```

**Recommendation:**
Either:
1. **Implement full MCP integration** (recommended for long-term)
2. **Remove MCP documentation** to avoid confusion (short-term)

**Rating:** 2/10 - Documented but not implemented

---

### 7. Todoist MCP ⚠️ MINIMAL

**Current Implementation:**
- Used only for quick capture (no project context)
- Creates tasks in Todoist Inbox
- No advanced Todoist MCP integration

**Example Usage:**
```
User: "Quick task: Buy milk"

Result:
- Todoist task: "Buy milk" in Inbox
- No ClickUp task
- No Obsidian task
```

**Missing Opportunities:**
1. **Quick capture with tags** - "Quick task: #shopping Buy milk"
2. **Natural language dates** - Todoist supports "tomorrow at 3pm"
3. **Quick capture to project** - "Quick task for Marketing: Post tweet"
4. **Integration with Obsidian** - Could also log to daily note
5. **Priority support** - Todoist supports priorities 1-4

**Rating:** 6/10 - Works for basic quick capture, but underutilized

---

### 8. Wiki-Link Strategy ✅ STRONG

**Current Implementation:**
```markdown
- [ ] Task name 🔺 📅 2026-01-27 [CU-abc123] #tags
  📍 [[2-Areas/Nomads|Nomads]] ← Area
  📍 [[1-Projects/Nomads/Active/Marketing|Marketing]] ← Project
```

**Strengths:**
1. **ClickUp ID linking** - `[CU-xxxxx]` format for easy reference
2. **Area links** - Points to area notes in `2-Areas/`
3. **Project links** - Points to project folders in `1-Projects/`
4. **Bi-directional linking** - ClickUp tasks have Obsidian links in description
5. **Tag consistency** - Uses Obsidian Tasks format with hashtags

**Example from `create-nomads-forecast-task.js`:**
```javascript
const obsidianTask = `- [ ] ${taskName} 🔺 ${cuId} #finance #business-model #strategy #nomads
  📍 [[1-Projects/Nomads/Active|Nomads Active]]
  **Created:** ${currentDate}
  **Priority:** High
  ...
  **ClickUp:** ${clickUpTask.url}`;

// Written to: 1-Projects/Nomads/Active/_summary.md
```

**Rating:** 9/10 - Excellent wiki-link strategy, best part of the skill

---

### 9. Formatting Consistency ⚠️ MODERATE

**Obsidian Tasks Format Compliance:**

| Element | Required | Implemented |
|---------|----------|-------------|
| Checkbox `- [ ]` | ✅ | ✅ |
| Task name | ✅ | ✅ |
| Priority emoji (🔺🔼🔽) | ✅ | ✅ |
| Due date `📅 YYYY-MM-DD` | ✅ | ✅ |
| Completion date `✅ YYYY-MM-DD` | ✅ ❌ | ⚠️ Partially |
| Time `⏰ HH:MM` | ✅ | ❌ No time emoji used |
| Tags `#tag` | ✅ | ✅ |
| Estimates `⏱️ Xh` | ✅ | ❌ No estimates used |
| ClickUp ID `[CU-xxxxx]` | ✅ | ✅ |

**Issues:**
1. **No time emoji** - Uses `📅` for both dates and times
2. **No estimates** - `#time/Xh` mentioned but not consistently applied
3. **Completion format** - Not documented when marking tasks complete

**Example Improvement:**
```markdown
- [ ] Task name 🔺 📅 2026-01-27 ⏰ 14:00 [CU-abc123] #tag1 #tag2 ⏱️ 2h
  📍 [[1-Projects/Project|Project]]
  📍 [[2-Areas/Area|Area]]
```

**Rating:** 7/10 - Good base format, but missing time and estimates

---

### 10. Edge Cases ❌ POOR

**What Happens When...**

| Scenario | Current Behavior | Recommended |
|----------|-----------------|-------------|
| Project ID invalid | ❌ API error (400) | Validate list ID before creation |
| List doesn't exist | ❌ API error, no guidance | List all available lists |
| Obsidian folder missing | ❌ File write error | Auto-create folder structure |
| Network timeout | ❌ Hangs indefinitely | Add timeout (30s default) |
| Rate limit hit | ❌ API error (429) | Exponential backoff retry |
| Duplicate task | ❌ Creates duplicate | Detect and ask user |
| Invalid due date | ❌ ClickUp rejects task | Validate before API call |
| Missing API token | ❌ Generic error | Clear error with setup instructions |
| Task too long (>2500 chars) | ❌ May fail silently | Truncate with ellipsis |
| Special characters in name | ❌ May break markdown | Escape properly |
| No area/project specified | ⚠️ Uses first list | Ask user to confirm |

**Example Error Handling Needed:**
```javascript
async function validateListId(listId) {
  try {
    const list = await clickUpAPI.getList(listId);
    return list;
  } catch (error) {
    throw new Error(`List "${listId}" not found. Available lists:\n` +
      await listAllLists());
  }
}

async function listAllLists() {
  const spaces = await clickUpAPI.getSpaces();
  let output = '';

  for (const space of spaces) {
    output += `\n📦 ${space.name}\n`;
    const folders = await clickUpAPI.getFolders(space.id);
    for (const folder of folders) {
      output += `  📁 ${folder.name}\n`;
      const lists = await clickUpAPI.getLists(folder.id);
      for (const list of lists) {
        output += `    📋 ${list.name} (${list.id})\n`;
      }
    }
  }
  return output;
}
```

**Rating:** 2/10 - Very little edge case handling

---

## Optimization Opportunities

### High Priority (Fix Critical Bugs)

#### 1. Fix Time/Date Parsing Bugs ⏰🔴
**Impact:** CRITICAL - Times are being calculated incorrectly

**Issues:**
- Regex group access bugs
- Hardcoded values instead of using user input
- `setDate()` misuse

**Fix:**
```javascript
function parseSmartDueDate(options) {
  if (!options.due_date_time && !options.due_date) {
    return undefined;
  }

  const today = new Date();

  // Case 1: "today"
  if (options.due_date?.toLowerCase() === "today" && !options.due_date_time) {
    today.setHours(9, 0, 0, 0); // 9am
    return today.getTime();
  }

  // Case 2: "tomorrow"
  if (options.due_date?.toLowerCase() === "tomorrow" && !options.due_date_time) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow.getTime();
  }

  // Case 3: "today at Xpm" or "today at Xam"
  const todayAtMatch = options.due_date?.match(/today at (\d+)(am|pm)/i);
  if (todayAtMatch) {
    const hour = parseInt(todayAtMatch[1]);
    const period = todayAtMatch[2].toLowerCase();

    today.setHours(
      period === 'pm' && hour !== 12 ? hour + 12 : hour,
      0, 0, 0
    );
    return today.getTime();
  }

  // Case 4: "tomorrow at Xpm" or "tomorrow at Xam"
  const tomorrowAtMatch = options.due_date?.match(/tomorrow at (\d+)(am|pm)/i);
  if (tomorrowAtMatch) {
    const hour = parseInt(tomorrowAtMatch[1]);
    const period = tomorrowAtMatch[2].toLowerCase();

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(
      period === 'pm' && hour !== 12 ? hour + 12 : hour,
      0, 0, 0
    );
    return tomorrow.getTime();
  }

  // Case 5: Formatted time "HH:MM"
  if (options.due_date_time?.match(/^(\d{1,2}):(\d{2})$/)) {
    const [_, hours, mins] = options.due_date_time.match(/^(\d{1,2}):(\d{2})$/);
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(mins), 0, 0);
    return date.getTime();
  }

  // Case 6: Date object (for direct API)
  if (typeof options.due_date === 'object' && options.due_date.getTime) {
    return options.due_date.getTime();
  }

  // Case 7: ISO date string
  if (options.due_date_time || options.due_date) {
    const date = new Date(options.due_date_time || options.due_date);
    if (!isNaN(date.getTime())) {
      return date.getTime();
    }
  }

  return undefined; // Let ClickUp handle it
}
```

#### 2. Add Retry Logic with Rate Limit Handling 🔄🔴
**Impact:** HIGH - Prevents failures from temporary issues

```javascript
async function createTaskWithRetry(listId, params, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    timeoutMs = 30000
  } = options;

  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Add timeout to fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const result = await Promise.race([
        clickUpAPI.createTask(listId, params),
        new Promise((_, reject) =>
          timeoutId && setTimeout(() => reject(new Error('Timeout')), timeoutMs)
        )
      ]);

      clearTimeout(timeoutId);
      return {
        success: true,
        task: result,
        method: 'direct',
        attempts: attempt + 1
      };

    } catch (error) {
      lastError = error;

      // Don't retry auth errors
      if (error.status === 401 || error.status === 403) {
        throw new Error(
          '❌ Authentication failed. Check your CLICKUP_API_TOKEN.'
        );
      }

      // Don't retry validation errors
      if (error.status === 400) {
        throw new Error(
          `❌ Invalid request: ${error.message}`
        );
      }

      // Rate limit - wait and retry
      if (error.status === 429) {
        const waitTime = error.retryAfter || baseDelay * Math.pow(2, attempt);
        console.log(`⏳ Rate limited. Waiting ${waitTime}ms...`);
        await sleep(waitTime);
        continue;
      }

      // Network errors - retry
      if (error.code === 'ECONNREFUSED' ||
          error.code === 'ETIMEDOUT' ||
          error.message === 'Timeout') {
        if (attempt < maxRetries - 1) {
          const waitTime = baseDelay * Math.pow(2, attempt);
          console.log(`🔁 Network error. Retrying in ${waitTime}ms...`);
          await sleep(waitTime);
          continue;
        }
      }

      // Last attempt failed
      if (attempt === maxRetries - 1) {
        throw lastError;
      }
    }
  }

  throw lastError;
}
```

#### 3. Improve Error Messages 📝🔴
**Impact:** HIGH - Better user experience

```javascript
function getFriendlyErrorMessage(error, context) {
  if (error.status === 401 || error.status === 403) {
    return `❌ Authentication Error

Your ClickUp API token is invalid or expired.

To fix:
1. Go to https://app.clickup.com/settings/apps
2. Generate a new API token
3. Set CLICKUP_API_TOKEN environment variable
4. Try again`;
  }

  if (error.status === 404) {
    return `❌ Not Found

The resource you're trying to access doesn't exist.

Context: ${context}

To fix:
1. Check that the list ID is correct
2. Verify the list exists in your ClickUp workspace
3. Try running "clawdbot exec discover-clickup" to see available lists`;
  }

  if (error.status === 429) {
    return `❌ Rate Limit Exceeded

You've hit ClickUp's API rate limit (100 requests/minute).

To fix:
1. Wait a few minutes and try again
2. Use batch operations for multiple tasks
3. Contact ClickUp for higher limits if needed`;
  }

  if (error.code === 'ECONNREFUSED') {
    return `❌ Connection Failed

Cannot connect to ClickUp. This could be:
- Network connectivity issues
- ClickUp service is down
- Firewall blocking requests

To fix:
1. Check your internet connection
2. Visit https://status.clickup.com to check service status
3. Try again in a few minutes`;
  }

  return `❌ Error

${error.message}

Context: ${context}`;
}
```

---

### Medium Priority (Add Missing Features)

#### 4. Add Batch Operations 📦🟡
**Impact:** MEDIUM - Useful for rapid task entry

```javascript
async function createBatchTasks(listId, tasks) {
  const results = {
    successful: [],
    failed: [],
    total: tasks.length
  };

  for (const task of tasks) {
    try {
      const created = await createTaskWithRetry(listId, task);
      results.successful.push({
        name: task.name,
        taskId: created.task.id,
        url: created.task.url
      });
    } catch (error) {
      results.failed.push({
        name: task.name,
        error: error.message
      });
    }
  }

  // Create Obsidian batch entry
  const obsidianBatch = `## Batch Tasks Created - ${new Date().toISOString().split('T')[0]}

${results.successful.map(t =>
  `- [ ] ${t.name} ${t.taskId ? `[${t.taskId}]` : ''}`
).join('\n')}

${results.failed.length > 0 ? `
### Failed (${results.failed.length})
${results.failed.map(t => `- ❌ ${t.name}: ${t.error}`).join('\n')}
` : ''}

---
**Summary:** ${results.successful.length}/${results.total} successful
`;

  return results;
}

// Usage
const tasks = [
  { name: "Task 1", priority: 2 },
  { name: "Task 2", priority: 3 },
  { name: "Task 3", priority: 1 }
];

const result = await createBatchTasks(listId, tasks);
console.log(`Created ${result.successful.length}/${result.total} tasks`);
```

#### 5. Add Duplicate Detection 🔍🟡
**Impact:** MEDIUM - Prevents clutter

```javascript
async function findDuplicateTask(listId, taskName) {
  const tasks = await clickUpAPI.getTasks(listId, {
    include_closed: false
  });

  const normalizedInput = taskName.toLowerCase().trim();

  // Check for exact matches
  const exactMatch = tasks.find(t =>
    t.name.toLowerCase().trim() === normalizedInput
  );

  if (exactMatch) {
    return {
      found: true,
      type: 'exact',
      task: exactMatch,
      message: `Found exact match: "${exactMatch.name}" (${exactMatch.url})`
    };
  }

  // Check for similar matches (fuzzy matching)
  const similarMatches = tasks.filter(t => {
    const similarity = calculateSimilarity(normalizedInput, t.name.toLowerCase());
    return similarity > 0.85; // 85% similarity threshold
  });

  if (similarMatches.length > 0) {
    return {
      found: true,
      type: 'similar',
      tasks: similarMatches,
      message: `Found ${similarMatches.length} similar task(s):\n` +
        similarMatches.map(t => `- "${t.name}" (${t.url})`).join('\n')
    };
  }

  return { found: false };
}

// Simple similarity calculation (Levenshtein distance-based)
function calculateSimilarity(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const maxLen = Math.max(len1, len2);

  if (maxLen === 0) return 1;

  // Levenshtein distance
  const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(null));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[len1][len2];
  return 1 - distance / maxLen;
}

// Usage with user confirmation
async function createTaskWithDuplicateCheck(listId, params) {
  const duplicate = await findDuplicateTask(listId, params.name);

  if (duplicate.found) {
    console.log(`⚠️ ${duplicate.message}`);
    console.log('\nOptions:');
    console.log('1. Create anyway');
    console.log('2. Use existing task');
    console.log('3. Cancel');

    // Ask user (in real implementation, this would be interactive)
    // For now, return the duplicate info and let user decide
    return {
      status: 'duplicate_found',
      duplicate: duplicate,
      action: 'required'
    };
  }

  return await createTaskWithRetry(listId, params);
}
```

#### 6. Add Project Auto-Creation 🏗️🟡
**Impact:** MEDIUM - Improves workflow when project doesn't exist

```javascript
async function ensureProjectExists(area, project) {
  const vaultPath = process.env.OBSIDIAN_VAULT;
  const projectPath = path.join(
    vaultPath,
    '1-Projects',
    area,
    'Active',
    project.replace(/\s+/g, '-')
  );

  // Check if project folder exists
  try {
    await fs.access(projectPath);
    console.log(`✅ Project exists: ${projectPath}`);
    return { exists: true, path: projectPath };
  } catch {
    // Create project folder
    console.log(`📁 Creating project: ${projectPath}`);
    await fs.mkdir(projectPath, { recursive: true });

    // Create _summary.md
    const summaryPath = path.join(projectPath, '_summary.md');
    const summaryContent = `# ${project}

> Part of [[1-Projects/${area}|${area}]]
> Created: ${new Date().toISOString().split('T')[0]}

## 🔴 High Priority / Critical

## 🟡 Should Do

## 🟢 Nice to Have

## 📊 Progress

**Status:** 🟢 Planning
**Completion:** 0%
**Last Updated:** ${new Date().toISOString().split('T')[0]}

## 📝 Notes

## 🔗 Links

- ClickUp: [Open in ClickUp]()
- Related Areas: [[2-Areas/${area}|${area}]]

## 📅 Timeline

- **Created:** ${new Date().toISOString().split('T')[0]}
`;

    await fs.writeFile(summaryPath, summaryContent);

    return { exists: false, path: projectPath, created: true };
  }
}

// Also create ClickUp folder/list if it doesn't exist
async function ensureClickUpListExists(spaceId, folderName, listName) {
  const folders = await clickUpAPI.getFolders(spaceId);

  let folder = folders.find(f => f.name === folderName);

  if (!folder) {
    console.log(`📁 Creating ClickUp folder: ${folderName}`);
    folder = await clickUpAPI.createFolder(spaceId, { name: folderName });
  }

  const lists = await clickUpAPI.getLists(folder.id);
  let list = lists.find(l => l.name === listName);

  if (!list) {
    console.log(`📋 Creating ClickUp list: ${listName}`);
    list = await clickUpAPI.createList(folder.id, { name: listName });
  }

  return list;
}
```

#### 7. Add Task Dependencies 🔄🟡
**Impact:** MEDIUM - Useful for complex workflows

```javascript
async function createTaskWithDependencies(listId, params, dependencies = []) {
  // First, create the task
  const task = await createTaskWithRetry(listId, params);

  // Then, add dependencies if any
  if (dependencies.length > 0) {
    await clickUpAPI.updateTask(task.task.id, {
      dependencies: dependencies.map(d => d.taskId)
    });

    console.log(`🔗 Task "${params.name}" depends on:`);
    dependencies.forEach((dep, i) => {
      console.log(`  ${i + 1}. ${dep.name} (${dep.url})`);
    });
  }

  return task;
}

// Natural language parsing for dependencies
function parseDependencies(taskDescription) {
  const patterns = [
    /after (?:I finish|completing) "([^"]+)"/i,
    /wait for "([^"]+)"/i,
    /depends on "([^"]+)"/i,
    /once "([^"]+)" is done/i
  ];

  const dependencies = [];

  for (const pattern of patterns) {
    const match = taskDescription.match(pattern);
    if (match) {
      dependencies.push(match[1]);
    }
  }

  return dependencies;
}

// Usage
const description = "Create presentation after I finish market research";
const dependencies = parseDependencies(description);

if (dependencies.length > 0) {
  console.log(`Found dependencies: ${dependencies.join(', ')}`);
  // Find the referenced tasks by name
  // Create the new task with those dependencies
}
```

---

### Low Priority (Enhancements)

#### 8. Add Time Tracking Support ⏱️🟢
**Impact:** LOW - Nice to have for time tracking

```javascript
async function createTaskWithEstimate(listId, params, estimateMinutes) {
  const task = await createTaskWithRetry(listId, {
    ...params,
    time_estimate: estimateMinutes * 60 * 1000 // Convert to milliseconds
  });

  // Add to Obsidian with estimate
  const obsidianTask = `- [ ] ${params.name} 🔺 ⏱️ ${estimateMinutes}m [CU-${task.task.id}]\n`;

  return { ...task, estimateMinutes };
}

// Parse estimates from task description
function parseTimeEstimate(description) {
  const patterns = [
    /(\d+)\s*(?:min|minutes|m)\b/i,
    /(\d+)\s*(?:hour|hours|h)\b/i,
    /(\d+)\s*hrs?\b/i
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) {
      const value = parseInt(match[1]);
      if (pattern.source.includes('hour') || pattern.source.includes('h')) {
        return value * 60; // Convert hours to minutes
      }
      return value;
    }
  }

  return null;
}
```

#### 9. Add Subtasks Support 📋🟢
**Impact:** LOW - Useful for breaking down tasks

```javascript
async function createTaskWithSubtasks(listId, params, subtasks = []) {
  // Create parent task
  const parentTask = await createTaskWithRetry(listId, params);

  // Create subtasks
  const createdSubtasks = [];

  for (const subtask of subtasks) {
    const subtaskResult = await clickUpAPI.createTask(listId, {
      ...subtask,
      parent: parentTask.task.id
    });
    createdSubtasks.push(subtaskResult);
  }

  return {
    parent: parentTask,
    subtasks: createdSubtasks
  };
}

// Parse subtasks from description
function parseSubtasks(description) {
  const subtaskPattern = /^\s*[-*]\s+(.+)$/gm;
  const subtasks = [];
  let match;

  while ((match = subtaskPattern.exec(description)) !== null) {
    subtasks.push({
      name: match[1].trim(),
      priority: 3, // Default priority
      status: 'todo'
    });
  }

  return subtasks;
}
```

#### 10. Add Custom Fields Support 🏷️🟢
**Impact:** LOW - Useful for specialized workflows

```javascript
async function createTaskWithCustomFields(listId, params, customFields = {}) {
  const task = await createTaskWithRetry(listId, {
    ...params,
    custom_fields: customFields
  });

  return task;
}

// Example usage
await createTaskWithCustomFields(listId, {
  name: "Review PR",
  priority: 2
}, {
  'Repository': 'github.com/org/repo',
  'PR Number': 123,
  'Review Type': 'Code Review',
  'Complexity': 'Medium'
});
```

---

## Integration Guide

### How pkm-create-task Works with Other PKM Skills

```
┌─────────────────────────────────────────────────────────────┐
│                     PKM SYSTEM OVERVIEW                     │
└─────────────────────────────────────────────────────────────┘

    ┌─────────────┐
    │   INBOX     │  <-- pkm-inbox-process
    └──────┬──────┘
           │ Process & Route
           ▼
    ┌─────────────────┐
    │ pkm-create-task │  <-- Create tasks in ClickUp/Obsidian/Todoist
    └────────┬────────┘
             │
     ┌───────┴────────┐
     │                │
     ▼                ▼
┌───────────┐   ┌──────────────┐
│  ClickUp  │   │   Obsidian   │
└─────┬─────┘   └──────┬───────┘
      │                │
      │                │
      ▼                ▼
┌──────────────────────┐
│  pkm-daily-plan      │  <-- Read ClickUp tasks, create daily plan
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  pkm-daily-closeout  │  <-- Mark complete, update ClickUp
└──────────────────────┘
```

### Workflow Examples

#### Example 1: Morning Planning Workflow

```
User: "Plan my day"

AI (pkm-daily-plan):
1. Scan ClickUp for all active tasks
2. Filter by due date, priority, status
3. Identify top 3 tasks
4. Check Obsidian for project priorities
5. Create daily plan in Daily/YYYY-MM-DD.md
6. Suggest helper notes for complex tasks
```

#### Example 2: Quick Task Capture (Throughout Day)

```
User: "Add task: Fix booking bug under Nomads > Finance"

AI (pkm-create-task):
1. Parse "under Nomads > Finance"
2. Match "Finance" → "Month End Accounting" list
3. Create task in ClickUp Month End Accounting
4. Add to Obsidian: 1-Projects/Nomads/Active/_summary.md
5. Link back: [[2-Areas/Nomads]]
6. Return: "✅ Created: Fix booking bug [CU-abc123]"
```

#### Example 3: Evening Closeout

```
User: "Daily closeout"

AI (pkm-daily-closeout):
1. Read Daily/YYYY-MM-DD.md
2. Mark completed tasks in ClickUp (status: complete)
3. Track time in ClickUp if durations logged
4. Return incomplete tasks to project summaries
5. Ask for reflection
6. Create draft for tomorrow if requested
```

#### Example 4: Inbox Processing

```
User: "Process inbox"

AI (pkm-inbox-process):
1. Scan Obsidian/0-Inbox/ for unprocessed items
2. For each item:
   - Is it a task? → pkm-create-task
   - Is it a note? → Move to appropriate area
   - Is it reference? → Add to research folder
3. Clear inbox
```

### Data Flow

```
Task Creation Flow:
User Input → pkm-create-task → ClickUp API → Task Created
                         ↓                    ↓
                    Parse Metadata      [CU-xxxxx]
                         ↓                    ↓
              Identify Project/Area    ←────────
                         ↓
                    Obsidian Update
                    (1-Projects/.../_summary.md)

Daily Planning Flow:
pkm-daily-plan → ClickUp API (getTasks) → Filter & Prioritize
                                             ↓
                                      Daily/YYYY-MM-DD.md
                                             ↓
                                      Helper Notes (research)

Daily Closeout Flow:
pkm-daily-closeout → Daily/YYYY-MM-DD.md (read)
                         ↓
                   ClickUp API (updateTask: status='complete')
                         ↓
                   Project _summary.md (return incomplete)
```

### Configuration Requirements

For the full PKM system to work, ensure these environment variables are set:

```bash
# Required
OBSIDIAN_VAULT=/path/to/obsidian-vault
CLICKUP_API_TOKEN=your-clickup-token
CLICKUP_TEAM_ID=your-team-id

# Optional (for Todoist quick capture)
TODOIST_API_TOKEN=your-todoist-token

# Optional (for MCP integration - when implemented)
CLICKUP_MCP_URL=clickup://mcp
```

### File Structure

```
obsidian-vault/
├── 0-Inbox/
│   ├── Daily/
│   └── Fleeting-Notes/
├── 1-Projects/
│   ├── Nomads/
│   │   ├── Active/
│   │   │   ├── Marketing/_summary.md
│   │   │   ├── Nomads-Bangkok/_summary.md
│   │   │   └── ...
│   │   └── Archive/
│   └── Personal/
│       ├── Active/
│       └── Archive/
├── 2-Areas/
│   ├── Nomads.md
│   ├── Personal.md
│   └── Bamboo.md
├── Daily/
│   ├── 2026-01-26.md
│   ├── 2026-01-27.md
│   └── ...
└── notes/
    └── 2026-01-26-MEWS-API-Research.md
```

### Common Use Cases

| Use Case | Skill | Output |
|----------|-------|--------|
| Capture task mid-day | pkm-create-task | ClickUp task + Obsidian entry |
| Plan morning | pkm-daily-plan | Daily/YYYY-MM-DD.md with top 3 |
| End of day review | pkm-daily-closeout | ClickUp updated + reflection |
| Process inbox | pkm-inbox-process | Inbox cleared, tasks created |
| Project overview | pkm-project | Project summary with metrics |

---

## Recommendations

### Immediate Actions (This Week)

1. **Fix time/date parsing bugs** ⏰🔴
   - Priority: CRITICAL
   - Effort: 1 hour
   - Impact: Times are currently calculated incorrectly

2. **Add retry logic** 🔄🔴
   - Priority: HIGH
   - Effort: 2 hours
   - Impact: Prevents failures from network/rate limit issues

3. **Improve error messages** 📝🔴
   - Priority: HIGH
   - Effort: 1 hour
   - Impact: Much better user experience

### Short-Term (This Month)

4. **Add duplicate detection** 🔍🟡
   - Priority: MEDIUM
   - Effort: 3 hours
   - Impact: Prevents task clutter

5. **Add batch operations** 📦🟡
   - Priority: MEDIUM
   - Effort: 2 hours
   - Impact: Faster task entry

6. **Add project auto-creation** 🏗️🟡
   - Priority: MEDIUM
   - Effort: 2 hours
   - Impact: Smoother workflow

### Long-Term (Next Quarter)

7. **Implement MCP integration** 🔌🔵
   - Priority: LOW (but important)
   - Effort: 1 day
   - Impact: Enhanced capabilities, better context awareness

8. **Add task dependencies** 🔄🟡
   - Priority: LOW
   - Effort: 4 hours
   - Impact: Better complex workflows

9. **Add time tracking** ⏱️🟢
   - Priority: LOW
   - Effort: 2 hours
   - Impact: Better analytics

10. **Add subtasks** 📋🟢
    - Priority: LOW
    - Effort: 3 hours
    - Impact: Better task breakdown

---

## Questions for User

1. **Are there specific issues with the current pkm-create-task skill that need fixing?**
   - Have you experienced bugs or errors?
   - Is the time/date parsing working correctly for you?
   - Are you seeing any unexpected behavior?

2. **Do you want to add new features?**
   - Would batch operations be useful for your workflow?
   - Do you need task dependencies (e.g., "wait for X, then do Y")?
   - Would duplicate detection help prevent task clutter?

3. **Should I prioritize certain improvements over others?**
   - What's most important to you: speed, reliability, or features?
   - Do you use the MCP integration, or should we focus on the direct API?
   - Is Todoist quick capture working well, or should we improve it?

4. **What's your current usage pattern?**
   - Do you use the "under Area > SubArea" syntax often?
   - Are you using the daily plan/closeout workflow?
   - What's the most common way you create tasks?

---

## Summary

The `pkm-create-task` skill has a solid foundation with excellent wiki-link integration and flexible task routing. The main issues are:

**Critical Bugs (Must Fix):**
- Time/date parsing has serious bugs
- No error resilience (no retry logic)
- Generic error messages

**Missing Features (Should Add):**
- Duplicate detection
- Batch operations
- Project auto-creation
- Task dependencies

**Enhancement Opportunities:**
- MCP integration (documented but not implemented)
- Time tracking support
- Subtasks
- Custom fields

**Overall Rating:** 6.5/10
- Integration: 8/10
- API Coverage: 6/10
- Error Handling: 3/10
- Time/Date Logic: 4/10 (bugs)
- Area Routing: 8/10
- MCP Integration: 2/10 (not implemented)
- Todoist MCP: 6/10
- Wiki-Links: 9/10
- Formatting: 7/10
- Edge Cases: 2/10

**With Recommended Fixes:** 9/10
- Fix time/date bugs → 8/10
- Add retry logic → 8/10
- Improve error messages → 8/10
- Add duplicate detection → 9/10
- Add batch operations → 9/10

---

## Next Steps

1. **Review this report** and provide feedback
2. **Answer the questions** in the "Questions for User" section
3. **Prioritize fixes** - Which improvements matter most to you?
4. **Implement fixes** - I'll update the skill file based on your priorities

**Would you like me to:**
- ✅ Fix all critical bugs (time/date, retry, errors)
- ✅ Add batch operations and duplicate detection
- ✅ Implement MCP integration
- ✅ Create the updated skill file with all improvements
- ✅ Create example usage scripts

Let me know your priorities!
