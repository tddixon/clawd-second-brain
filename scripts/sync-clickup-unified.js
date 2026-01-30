#!/usr/bin/env node
/**
 * ClickUp ↔ Obsidian Unified Sync
 * 
 * Hierarchy Model (from v3):
 *   Space = Area → Folder = Project → Lists = Task Groups
 * 
 * Features:
 *   - 2-way sync (ClickUp ↔ Obsidian)
 *   - Inbox categorization with keyword matching
 *   - Individual task files with YAML frontmatter
 *   - Sync state tracking
 *   - Retry logic with exponential backoff
 *   - Dry-run mode
 *   - Comprehensive logging
 * 
 * Usage:
 *   ./sync-clickup-unified.js [--dry-run] [--area=NAME] [--verbose]
 */

const fs = require('fs');
const path = require('path');
const {
  sanitizeName,
  ensureDir,
  retryAPI,
  formatDate,
  formatDateTime,
  loadConfig,
  sleep,
} = require('./lib/utils.js');

// ============================================================================
// Configuration
// ============================================================================

const CONFIG_FILE = '/home/desktop/.clawdsync/clickup-agent-config';
const config = loadConfig(CONFIG_FILE);

const CLICKUP_BASE_URL = 'https://api.clickup.com/api/v2';
const OBSIDIAN_VAULT = config.OBSIDIAN_VAULT;
const SYNC_STATE_FILE = path.join(OBSIDIAN_VAULT, '.clawdsync', 'clickup-sync-state.json');
const LOG_FILE = '/home/desktop/clawd/logs/sync-clickup.log';

// Obsidian directories
const AREAS_DIR = path.join(OBSIDIAN_VAULT, '03-Areas');
const PROJECTS_DIR = path.join(OBSIDIAN_VAULT, '02-Projects');
const TASKS_DIR = path.join(OBSIDIAN_VAULT, '04-Tasks');
const INBOX_DIR = path.join(OBSIDIAN_VAULT, '00-Inbox');

// Ensure required directories exist
ensureDir(path.dirname(SYNC_STATE_FILE));
ensureDir(path.dirname(LOG_FILE));
ensureDir(AREAS_DIR);
ensureDir(PROJECTS_DIR);
ensureDir(TASKS_DIR);
ensureDir(INBOX_DIR);

// Validate credentials
if (!config.CLICKUP_API_TOKEN || !config.CLICKUP_TEAM_ID) {
  console.error('❌ CLICKUP_API_TOKEN and CLICKUP_TEAM_ID required');
  console.error('   Set in environment or in:', CONFIG_FILE);
  process.exit(1);
}

// CLI arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose');
const AREA_FILTER = args.find(arg => arg.startsWith('--area='))?.split('=')[1];

// ============================================================================
// Logging
// ============================================================================

function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] [${level}] ${message}\n`;
  
  // Console output
  console.log(message);
  
  // File output (skip in dry-run to avoid cluttering logs)
  if (!DRY_RUN) {
    try {
      fs.appendFileSync(LOG_FILE, logLine);
    } catch (e) {
      // Silently fail if logging fails
    }
  }
}

function logVerbose(message) {
  if (VERBOSE) {
    log(message, 'DEBUG');
  }
}

function logError(message, error) {
  const errorMsg = `${message}: ${error.message || error}`;
  log(errorMsg, 'ERROR');
  if (VERBOSE && error.stack) {
    console.error(error.stack);
  }
}

// ============================================================================
// Health Check
// ============================================================================

async function healthCheck() {
  try {
    log('🔍 Checking ClickUp API connectivity...');
    await apiRequest('/user');
    log('✅ ClickUp API is accessible');
    return true;
  } catch (error) {
    logError('ClickUp API health check failed', error);
    console.error('❌ ClickUp API is not accessible');
    console.error('💡 Verify your ClickUp API credentials and network connection');
    return false;
  }
}

// ============================================================================
// ClickUp API
// ============================================================================

async function apiRequest(endpoint, options = {}) {
  return retryAPI(async () => {
    const url = `${CLICKUP_BASE_URL}${endpoint}`;
    logVerbose(`API Request: ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': config.CLICKUP_API_TOKEN,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error ${response.status}: ${errorText}`);
    }
    
    return response.json();
  }, `ClickUp API ${options.method || 'GET'} ${endpoint}`);
}

async function getSpaces() {
  const data = await apiRequest(`/team/${config.CLICKUP_TEAM_ID}/space`);
  return data.spaces || [];
}

async function getFolders(spaceId) {
  try {
    const data = await apiRequest(`/space/${spaceId}/folder`);
    return data.folders || [];
  } catch (e) {
    logError(`Failed to get folders for space ${spaceId}`, e);
    return [];
  }
}

async function getFolderlessLists(spaceId) {
  try {
    const data = await apiRequest(`/space/${spaceId}/list`);
    return data.lists || [];
  } catch (e) {
    logError(`Failed to get folderless lists for space ${spaceId}`, e);
    return [];
  }
}

async function getLists(folderId) {
  try {
    const data = await apiRequest(`/folder/${folderId}/list`);
    return data.lists || [];
  } catch (e) {
    logError(`Failed to get lists for folder ${folderId}`, e);
    return [];
  }
}

async function getTasks(listId, options = {}) {
  try {
    const params = new URLSearchParams({
      include_closed: options.include_closed || false,
    });
    const data = await apiRequest(`/list/${listId}/task?${params}`);
    return data.tasks || [];
  } catch (e) {
    logError(`Failed to get tasks for list ${listId}`, e);
    return [];
  }
}

async function createTask(listId, taskData) {
  return apiRequest(`/list/${listId}/task`, {
    method: 'POST',
    body: JSON.stringify(taskData),
  });
}

async function updateTask(taskId, updates) {
  return apiRequest(`/task/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

// ============================================================================
// Sync State Management
// ============================================================================

function loadSyncState() {
  if (fs.existsSync(SYNC_STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(SYNC_STATE_FILE, 'utf-8'));
    } catch (e) {
      logError('Failed to load sync state, using empty state', e);
    }
  }
  
  return {
    lastSync: new Date().toISOString(),
    mappings: {
      spaces: {},   // space_id -> area_name
      folders: {},  // folder_id -> project_name
      lists: {},    // list_id -> project_name + list_name
      tasks: {},    // task_id -> task_file_path
    },
    versions: {
      spaces: {},
      folders: {},
      lists: {},
      tasks: {},
    },
  };
}

function saveSyncState(state) {
  if (!DRY_RUN) {
    try {
      fs.writeFileSync(SYNC_STATE_FILE, JSON.stringify(state, null, 2));
      logVerbose('Sync state saved');
    } catch (e) {
      logError('Failed to save sync state', e);
    }
  }
}

// ============================================================================
// Inbox Categorization (from v1)
// ============================================================================

function categorizeInboxTask(taskName, taskDescription) {
  const text = `${taskName} ${taskDescription || ''}`.toLowerCase();
  
  // Business keywords
  const nomadsKeywords = ['nomads', 'hostel', 'bangkok', 'ao nang', 'phuket', 'chiang mai', 'guest', 'booking', 'mews', 'reception', 'check-in', 'check-out'];
  const marketingKeywords = ['marketing', 'ads', 'facebook', 'instagram', 'tiktok', 'google ads', 'campaign', 'newsletter', 'social media', 'seo', 'content'];
  const accountingKeywords = ['accounting', 'finance', 'budget', 'cashflow', 'invoice', 'tax', 'revenue', 'expense', 'payroll'];
  const operationsKeywords = ['ops', 'operations', 'staff', 'hiring', 'training', 'schedule', 'inventory', 'maintenance', 'cleaning'];
  const developmentKeywords = ['code', 'website', 'booking engine', 'app', 'integration', 'api', 'development', 'clawd', 'automation'];
  const designKeywords = ['design', 'logo', 'branding', 'sign', 'poster', 'flyer', 'website design', 'ui', 'ux'];
  const legalKeywords = ['legal', 'contract', 'license', 'permit', 'visa', 'work permit', 'regulation', 'compliance'];
  
  // Personal keywords
  const healthKeywords = ['health', 'gym', 'fitness', 'workout', 'exercise', 'diet', 'doctor', 'appointment'];
  const travelKeywords = ['travel', 'flight', 'hotel', 'booking', 'trip', 'vacation', 'visa'];
  const learningKeywords = ['learn', 'course', 'book', 'read', 'study', 'tutorial', 'skill'];
  
  // Work/Client keywords
  const clientKeywords = ['client', 'consulting', 'freelance', 'contract', 'proposal'];
  
  // Check for business matches
  if (nomadsKeywords.some(k => text.includes(k))) {
    if (marketingKeywords.some(k => text.includes(k))) {
      return { category: 'Nomads', project: 'Nomads-Marketing', reason: 'Marketing-related task for Nomads' };
    }
    if (accountingKeywords.some(k => text.includes(k))) {
      return { category: 'Nomads', project: 'Nomads-Accounting', reason: 'Finance/accounting task for Nomads' };
    }
    if (developmentKeywords.some(k => text.includes(k))) {
      return { category: 'Nomads', project: 'Nomads-Automation', reason: 'Development/tech task for Nomads' };
    }
    if (designKeywords.some(k => text.includes(k))) {
      return { category: 'Nomads', project: 'Nomads-Design', reason: 'Design task for Nomads' };
    }
    if (legalKeywords.some(k => text.includes(k))) {
      return { category: 'Nomads', project: 'Nomads-Legal', reason: 'Legal/compliance task for Nomads' };
    }
    if (operationsKeywords.some(k => text.includes(k))) {
      return { category: 'Nomads', project: 'Nomads-Operations', reason: 'Operations task for Nomads' };
    }
    return { category: 'Nomads', project: 'Nomads-General', reason: 'General Nomads task' };
  }
  
  // Check for personal matches
  if (healthKeywords.some(k => text.includes(k))) {
    return { category: 'Personal', project: 'Personal-Health', reason: 'Health & fitness task' };
  }
  if (travelKeywords.some(k => text.includes(k))) {
    return { category: 'Personal', project: 'Personal-Travel', reason: 'Travel-related task' };
  }
  if (learningKeywords.some(k => text.includes(k))) {
    return { category: 'Personal', project: 'Personal-Learning', reason: 'Learning/development task' };
  }
  
  // Check for client work
  if (clientKeywords.some(k => text.includes(k))) {
    return { category: 'Work', project: 'Work-Clients', reason: 'Client work task' };
  }
  
  // Default - unclear
  return { category: 'Unclear', project: 'Needs-Clarification', reason: 'Unable to categorize - needs clarification' };
}

// ============================================================================
// Sync Functions
// ============================================================================

/**
 * Sync a Space as an Area
 */
function syncArea(space, state) {
  const areaName = sanitizeName(space.name);
  const areaFile = path.join(AREAS_DIR, `${areaName}.md`);
  
  // Track mapping
  state.mappings.spaces[space.id] = areaName;
  
  let content = `# ${space.name}\n\n`;
  content += `**Type:** Area\n`;
  content += `**ClickUp Space:** [View in ClickUp](https://app.clickup.com/space/${space.id})\n`;
  content += `**Sync ID:** #clickup-space-${space.id}\n\n`;
  content += `## Projects\n\n_Projects will be listed here..._\n\n`;
  content += `## Notes\n\n_Area overview and notes..._\n`;
  
  if (!DRY_RUN) {
    fs.writeFileSync(areaFile, content);
  }
  
  log(`  ✅ Area synced: ${areaName}`);
  return areaName;
}

/**
 * Sync a Folder as a Project (v3 hierarchy model)
 */
async function syncProject(space, folder, state) {
  const areaName = sanitizeName(space.name);
  const isInbox = folder.name.toLowerCase() === 'inbox';
  const projectName = isInbox 
    ? `${areaName}-Inbox` 
    : `${areaName}-${sanitizeName(folder.name)}`;
  const projectDir = path.join(PROJECTS_DIR, projectName);
  const projectFile = path.join(projectDir, `${projectName}.md`);
  
  ensureDir(projectDir);
  
  // Track mapping
  state.mappings.folders[folder.id] = projectName;
  
  // Build project note content
  let content = `# ${folder.name}${isInbox ? ' (Inbox)' : ''}\n\n`;
  content += `**Area:** [[${areaName}]]\n`;
  
  if (isInbox) {
    content += `**Type:** Inbox — Tasks here need to be organized into projects\n`;
  } else {
    content += `**Type:** Project\n`;
    content += `**Status:** Active\n`;
  }
  
  content += `**ClickUp Folder:** [View in ClickUp](https://app.clickup.com/${folder.id})\n`;
  content += `**Sync ID:** #clickup-folder-${folder.id}\n\n`;
  
  if (isInbox) {
    content += `## How to Use This Inbox\n\n`;
    content += `1. **Capture** tasks here when you're unsure of the project\n`;
    content += `2. **Review** the organization note (auto-generated)\n`;
    content += `3. **Move** tasks to appropriate projects in ClickUp\n\n`;
  } else {
    content += `## Description\n\n_Project overview..._\n\n`;
    content += `## Goals\n\n_What we want to achieve..._\n\n`;
    content += `## Progress\n\n`;
    content += `### Completed\n- [ ] ...\n\n`;
    content += `### In Progress\n- [ ] ...\n\n`;
    content += `### Next Steps\n- [ ] ...\n\n`;
  }
  
  content += `## Tasks by List\n\n_Task groups will be organized here by ClickUp list..._\n\n`;
  content += `## References\n\n_Links and resources..._\n\n`;
  content += `## Notes\n\n_Project notes and documentation..._\n`;
  
  if (!DRY_RUN) {
    fs.writeFileSync(projectFile, content);
  }
  
  log(`  ✅ Project synced: ${projectName}`);
  return { projectName, projectDir };
}

/**
 * Sync tasks from a List (Task Group within Project)
 */
async function syncTasksFromList(space, folder, list, projectName, state) {
  const tasks = await getTasks(list.id);
  
  if (tasks.length === 0) {
    logVerbose(`    📋 ${list.name}: 0 tasks`);
    return { tasks: [], created: 0 };
  }
  
  log(`    📋 ${list.name}: ${tasks.length} task(s)`);
  
  let created = 0;
  
  for (const task of tasks) {
    const taskFileName = sanitizeName(task.name).substring(0, 50);
    const taskFile = path.join(TASKS_DIR, `${taskFileName}.md`);
    
    // Skip if already exists (could be updated in future enhancement)
    if (fs.existsSync(taskFile)) {
      logVerbose(`      ⏭️  Task exists: ${taskFileName}`);
      continue;
    }
    
    // Map ClickUp priority to TaskNotes priority
    let priority = 'normal';
    if (task.priority) {
      if (task.priority.priority === 'urgent') priority = 'urgent';
      else if (task.priority.priority === 'high') priority = 'high';
      else if (task.priority.priority === 'low') priority = 'low';
    }
    
    // Map ClickUp status
    const status = task.status?.type === 'closed' ? 'done' : 'open';
    
    // Format dates
    const dueDate = formatDate(task.due_date);
    const createdDate = formatDateTime(task.date_created);
    const updatedDate = formatDateTime(task.date_updated || task.date_created);
    
    // Build assignees list
    const assignees = task.assignees?.map(a => a.username).join(', ') || '';
    
    // Build task file content with YAML frontmatter
    let content = `---\n`;
    content += `status: ${status}\n`;
    content += `tags:\n  - task\n  - clickup-import\n`;
    content += `priority: ${priority}\n`;
    content += `projects: ["[[${projectName}]]"]\n`;
    content += `due: ${dueDate}\n`;
    content += `dateCreated: ${createdDate}\n`;
    content += `dateModified: ${updatedDate}\n`;
    content += `clickup_id: ${task.id}\n`;
    content += `clickup_url: ${task.url}\n`;
    content += `clickup_list: ${list.name}\n`;
    content += `clickup_status: ${task.status?.status || 'unknown'}\n`;
    if (assignees) {
      content += `assignees: ${assignees}\n`;
    }
    content += `---\n\n`;
    content += `# ${task.name}\n\n`;
    content += `${task.description || ''}\n\n`;
    content += `## ClickUp Reference\n`;
    content += `- **Task ID:** ${task.id}\n`;
    content += `- **URL:** ${task.url}\n`;
    content += `- **List:** ${list.name}\n`;
    content += `- **Project:** ${folder.name}\n`;
    content += `- **Area:** ${space.name}\n`;
    content += `- **Status:** ${task.status?.status || 'Unknown'}\n`;
    if (assignees) {
      content += `- **Assignees:** ${assignees}\n`;
    }
    content += `\n---\n`;
    content += `*Imported from ClickUp on ${new Date().toISOString().split('T')[0]}*\n`;
    
    if (!DRY_RUN) {
      fs.writeFileSync(taskFile, content);
      state.mappings.tasks[task.id] = taskFile;
      created++;
    }
    
    logVerbose(`      📝 Created: ${taskFileName}`);
  }
  
  if (created > 0) {
    log(`      ✅ Created ${created} task file(s)`);
  }
  
  return { tasks, created };
}

/**
 * Handle Inbox with categorization
 */
async function handleInbox(space, folder, state) {
  const areaName = sanitizeName(space.name);
  const inboxDir = path.join(INBOX_DIR);
  const inboxFile = path.join(inboxDir, `${areaName}-Inbox-Organization.md`);
  
  // Get all lists in the inbox folder
  const lists = await getLists(folder.id);
  
  // Collect all tasks from all lists
  let allTasks = [];
  for (const list of lists) {
    const tasks = await getTasks(list.id);
    allTasks = allTasks.concat(tasks.map(t => ({ ...t, listName: list.name })));
  }
  
  if (allTasks.length === 0) {
    log(`    ✅ Inbox is empty`);
    return;
  }
  
  log(`    📥 Inbox has ${allTasks.length} task(s) to organize`);
  
  // Categorize all tasks
  const categorized = {};
  const needsClarification = [];
  
  for (const task of allTasks) {
    const categorization = categorizeInboxTask(task.name, task.description);
    
    if (categorization.category === 'Unclear') {
      needsClarification.push({ task, categorization });
    } else {
      if (!categorized[categorization.project]) {
        categorized[categorization.project] = [];
      }
      categorized[categorization.project].push({ task, categorization });
    }
  }
  
  // Build organization note content
  let content = `# ${areaName} Inbox Organization\n\n`;
  content += `**Folder:** [[${areaName}]]  \n`;
  content += `**ClickUp Folder:** [View in ClickUp](https://app.clickup.com/${folder.id})  \n`;
  content += `**Total Tasks:** ${allTasks.length}  \n`;
  content += `**Generated:** ${new Date().toISOString().split('T')[0]}  \n\n`;
  content += `> **Action Required:** Review tasks below and move to appropriate projects in ClickUp.\n\n`;
  
  // Organized tasks by suggested project
  if (Object.keys(categorized).length > 0) {
    content += `## Suggested Organization\n\n`;
    
    for (const [projectName, items] of Object.entries(categorized)) {
      content += `### ${projectName} (${items.length} tasks)\n\n`;
      content += `**Area:** [[${areaName}]]  \n`;
      content += `**Reasoning:** ${items[0].categorization.reason}\n\n`;
      
      for (const { task } of items) {
        const dueDate = formatDate(task.due_date) || 'No due date';
        content += `- [ ] **${task.name}**  \n`;
        content += `  - Due: ${dueDate} | List: ${task.listName} | ClickUp ID: \`${task.id}\`  \n`;
        if (task.description) {
          const shortDesc = task.description.substring(0, 100);
          content += `  - *${shortDesc}${task.description.length > 100 ? '...' : ''}*  \n`;
        }
        content += `  - [Move to ${projectName}](https://app.clickup.com/t/${task.id})  \n\n`;
      }
    }
  }
  
  // Tasks needing clarification
  if (needsClarification.length > 0) {
    content += `## ⚠️ Needs Clarification (${needsClarification.length} tasks)\n\n`;
    content += `These tasks couldn't be automatically categorized. Please:\n`;
    content += `- Add more descriptive keywords to the task name\n`;
    content += `- Move manually to the appropriate project\n`;
    content += `- Ask for clarification\n\n`;
    
    for (const { task } of needsClarification) {
      const dueDate = formatDate(task.due_date) || 'No due date';
      content += `- [ ] **${task.name}**  \n`;
      content += `  - Due: ${dueDate} | List: ${task.listName} | ClickUp ID: \`${task.id}\`  \n`;
      if (task.description) {
        const shortDesc = task.description.substring(0, 100);
        content += `  - *${shortDesc}${task.description.length > 100 ? '...' : ''}*  \n`;
      }
      content += `  - [View in ClickUp](https://app.clickup.com/t/${task.id})  \n\n`;
    }
  }
  
  // Action items
  content += `## Next Steps\n\n`;
  content += `- [ ] Review organized tasks above\n`;
  content += `- [ ] Move tasks to appropriate projects in ClickUp\n`;
  content += `- [ ] Clarify any unclear tasks\n`;
  content += `- [ ] Archive this note when inbox is empty\n\n`;
  content += `---\n`;
  content += `*This note is auto-generated. Tasks are categorized based on keywords. Review before moving.*\n`;
  
  if (!DRY_RUN) {
    fs.writeFileSync(inboxFile, content);
  }
  
  log(`    📝 Inbox organization note created`);
}

/**
 * Push Obsidian changes back to ClickUp (2-way sync from v1)
 */
async function pushObsidianToClickUp(state) {
  log('\n📤 Checking for Obsidian changes to push to ClickUp...\n');
  
  // Find all project files
  const projectFiles = fs.readdirSync(PROJECTS_DIR)
    .filter(f => fs.statSync(path.join(PROJECTS_DIR, f)).isDirectory())
    .map(d => path.join(PROJECTS_DIR, d, `${d}.md`))
    .filter(f => fs.existsSync(f));
  
  let created = 0;
  let completed = 0;
  
  for (const projectFile of projectFiles) {
    const content = fs.readFileSync(projectFile, 'utf-8');
    
    // Extract folder ID from sync tag
    const folderIdMatch = content.match(/#clickup-folder-(\w+)/);
    if (!folderIdMatch) continue;
    
    const folderId = folderIdMatch[1];
    
    // Get lists in this folder to find where to create tasks
    const lists = await getLists(folderId);
    if (lists.length === 0) continue;
    
    // Use first list as default target (could be enhanced)
    const defaultListId = lists[0].id;
    
    // Find new tasks (checkbox items without clickup-task ID)
    const newTaskMatches = content.matchAll(/- \[ \] (.+?)(?:\n|$)/g);
    
    for (const match of newTaskMatches) {
      const taskLine = match[1].trim();
      
      // Skip if already has clickup ID
      if (taskLine.includes('#clickup-task-')) continue;
      
      // Skip template/placeholder text
      if (taskLine.startsWith('...') || taskLine.startsWith('_')) continue;
      
      // Extract task name (remove wiki links, due dates, etc.)
      const taskName = taskLine
        .replace(/\[\[.*?\]\]/g, '') // Remove wiki links
        .replace(/ — Due: \d{4}-\d{2}-\d{2}/, '') // Remove due date
        .replace(/ \[\w+\]/, '') // Remove priority tags
        .trim();
      
      if (taskName.length < 3) continue; // Skip very short names
      
      // Parse due date if present
      const dueMatch = taskLine.match(/Due: (\d{4}-\d{2}-\d{2})/);
      const dueDate = dueMatch 
        ? new Date(dueMatch[1]).getTime() 
        : undefined;
      
      log(`  Creating ClickUp task: ${taskName}`);
      
      if (!DRY_RUN) {
        try {
          const newTask = await createTask(defaultListId, {
            name: taskName,
            due_date: dueDate,
            description: 'Created from Obsidian',
          });
          
          // Update the markdown with the clickup ID
          const updatedContent = content.replace(
            `- [ ] ${taskLine}`,
            `- [ ] ${taskLine} #clickup-task-${newTask.id}`
          );
          fs.writeFileSync(projectFile, updatedContent);
          
          created++;
          log(`    ✅ Created: ${newTask.url}`);
        } catch (e) {
          logError(`    ❌ Failed to create task`, e);
        }
      } else {
        log(`    [DRY RUN] Would create task`);
      }
    }
    
    // Find completed tasks in Obsidian
    const completedMatches = content.matchAll(/- \[x\] (.+?)#clickup-task-(\w+)/g);
    
    for (const match of completedMatches) {
      const taskId = match[2];
      
      // Check if we already synced this completion
      if (state.mappings.tasks[taskId]?.includes('[x]')) continue;
      
      log(`  Marking ClickUp task complete: ${taskId}`);
      
      if (!DRY_RUN) {
        try {
          await updateTask(taskId, { status: 'closed' });
          completed++;
          log(`    ✅ Marked complete`);
        } catch (e) {
          logError(`    ❌ Failed to update task`, e);
        }
      } else {
        log(`    [DRY RUN] Would mark complete`);
      }
    }
  }
  
  if (created > 0 || completed > 0) {
    log(`\n📤 Pushed to ClickUp: ${created} created, ${completed} completed`);
  } else {
    log(`\n📤 No changes to push to ClickUp`);
  }
}

// ============================================================================
// Main Sync
// ============================================================================

async function sync() {
  const startTime = Date.now();
  
  log('🔄 ClickUp ↔ Obsidian Unified Sync');
  log('==================================');
  log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE SYNC'}`);
  log(`Area filter: ${AREA_FILTER || 'All areas'}`);
  log(`Verbose: ${VERBOSE ? 'Yes' : 'No'}`);
  log('');
  log('Hierarchy: Space = Area → Folder = Project → Lists = Task Groups');
  log('');
  
  const state = loadSyncState();
  const stats = {
    areas: 0,
    projects: 0,
    tasks: 0,
    inboxNotes: 0,
  };
  
  try {
    // Step 1: Fetch ClickUp structure
    log('📥 Fetching ClickUp structure...\n');
    
    const spaces = await getSpaces();
    log(`Found ${spaces.length} space(s) (Areas)\n`);
    
    for (const space of spaces) {
      // Apply area filter if specified
      if (AREA_FILTER && !space.name.toLowerCase().includes(AREA_FILTER.toLowerCase())) {
        log(`⏭️  Skipping space: ${space.name} (filtered)\n`);
        continue;
      }
      
      log(`📦 ${space.name} (Space = Area)`);
      
      // Sync area
      syncArea(space, state);
      stats.areas++;
      
      // Get folders (PROJECTS in v3 hierarchy)
      const folders = await getFolders(space.id);
      const folderlessLists = await getFolderlessLists(space.id);
      
      log(`  Found ${folders.length} folder(s) (Projects) + ${folderlessLists.length} folderless list(s)`);
      
      // Process folders as projects
      for (const folder of folders) {
        const isInbox = folder.name.toLowerCase() === 'inbox';
        
        log(`\n  📁 ${folder.name}${isInbox ? ' (INBOX)' : ''}`);
        
        // Sync project
        const { projectName } = await syncProject(space, folder, state);
        stats.projects++;
        
        // Get lists within this folder (Task Groups)
        const lists = await getLists(folder.id);
        
        if (isInbox) {
          // Handle inbox specially with categorization
          await handleInbox(space, folder, state);
          stats.inboxNotes++;
        }
        
        // Sync tasks from each list
        for (const list of lists) {
          const { created } = await syncTasksFromList(space, folder, list, projectName, state);
          stats.tasks += created;
        }
      }
      
      // Process folderless lists
      if (folderlessLists.length > 0) {
        log(`\n  📂 Folderless Lists (${folderlessLists.length}):`);
        
        for (const list of folderlessLists) {
          // Create a pseudo-folder for each folderless list
          const pseudoFolder = {
            id: `folderless-${list.id}`,
            name: list.name,
          };
          
          const { projectName } = await syncProject(space, pseudoFolder, state);
          stats.projects++;
          
          const { created } = await syncTasksFromList(space, pseudoFolder, list, projectName, state);
          stats.tasks += created;
        }
      }
      
      log('');
    }
    
    // Step 2: Push Obsidian changes to ClickUp (2-way sync)
    await pushObsidianToClickUp(state);
    
    // Save state
    state.lastSync = new Date().toISOString();
    saveSyncState(state);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    log('\n==================================');
    log('✅ Sync Complete!');
    log(`  Areas: ${stats.areas}`);
    log(`  Projects: ${stats.projects}`);
    log(`  Tasks: ${stats.tasks}`);
    log(`  Inbox notes: ${stats.inboxNotes}`);
    log(`  Duration: ${duration}s`);
    log('==================================');
    
  } catch (error) {
    logError('❌ Sync failed', error);
    process.exit(1);
  }
}

// ============================================================================
// CLI Entry Point
// ============================================================================

if (require.main === module) {
  sync().catch(err => {
    logError('Fatal error', err);
    process.exit(1);
  });
}

module.exports = { sync };
