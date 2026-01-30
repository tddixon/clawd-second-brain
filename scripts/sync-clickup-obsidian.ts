#!/usr/bin/env ts-node
/**
 * ClickUp ↔ Obsidian 2-Way Sync
 * 
 * Maps:
 * - ClickUp Folders → Obsidian Areas (03-Areas/)
 * - ClickUp Lists → Obsidian Projects (02-Projects/)
 * - ClickUp Tasks → Obsidian Tasks (embedded in project notes)
 */

import * as fs from 'fs';
import * as path from 'path';
import { ClickUpAPI } from '../projects/pkm-system/scripts/clickup-api';

// Configuration
const OBSIDIAN_VAULT = '/home/desktop/obsidian-second-brain';
const SYNC_STATE_FILE = path.join(OBSIDIAN_VAULT, '.clawdsync', 'clickup-sync-state.json');
const AREAS_DIR = path.join(OBSIDIAN_VAULT, '03-Areas');
const PROJECTS_DIR = path.join(OBSIDIAN_VAULT, '02-Projects');

// Ensure directories exist
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

ensureDir(path.join(OBSIDIAN_VAULT, '.clawdsync'));
ensureDir(AREAS_DIR);
ensureDir(PROJECTS_DIR);

// Sync state management
interface SyncState {
  lastSync: string;
  mappings: {
    folders: Record<string, string>; // clickup_folder_id -> area_name
    lists: Record<string, string>;   // clickup_list_id -> project_path
    tasks: Record<string, string>;   // clickup_task_id -> task_line_in_file
  };
  versions: {
    folders: Record<string, number>; // clickup_folder_id -> version
    lists: Record<string, number>;   // clickup_list_id -> version
    tasks: Record<string, number>;   // clickup_task_id -> version
  };
}

function loadSyncState(): SyncState {
  if (fs.existsSync(SYNC_STATE_FILE)) {
    return JSON.parse(fs.readFileSync(SYNC_STATE_FILE, 'utf-8'));
  }
  return {
    lastSync: new Date().toISOString(),
    mappings: { folders: {}, lists: {}, tasks: {} },
    versions: { folders: {}, lists: {}, tasks: {} }
  };
}

function saveSyncState(state: SyncState) {
  fs.writeFileSync(SYNC_STATE_FILE, JSON.stringify(state, null, 2));
}

// Sanitize names for filesystem
function sanitizeName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Generate project folder name from folder + list
function getProjectFolderName(folderName: string, listName: string): string {
  const sanitizedFolder = sanitizeName(folderName);
  const sanitizedList = sanitizeName(listName);
  return `${sanitizedFolder}-${sanitizedList}`;
}

// Create or update Area note
function syncArea(folder: any, state: SyncState): string {
  const areaName = sanitizeName(folder.name);
  const areaDir = path.join(AREAS_DIR, areaName);
  const areaFile = path.join(areaDir, `${areaName}.md`);
  
  ensureDir(areaDir);
  
  // Track mapping
  state.mappings.folders[folder.id] = areaName;
  
  // Build area note content
  let content = `# ${folder.name}\n\n`;
  content += `**Type:** Area\n`;
  content += `**ClickUp Folder:** [View in ClickUp](https://app.clickup.com/${folder.id})\n`;
  content += `**Sync ID:** #clickup-folder-${folder.id}\n\n`;
  
  // List projects in this area
  content += `## Projects\n\n`;
  if (folder.lists && folder.lists.length > 0) {
    for (const list of folder.lists) {
      const projectName = getProjectFolderName(folder.name, list.name);
      content += `- [[${projectName}]] — ${list.task_count || 0} tasks\n`;
    }
  } else {
    content += `_No projects yet. Create a list in ClickUp to add a project._\n`;
  }
  
  content += `\n## Notes\n\n_Area overview and notes..._\n`;
  
  // Write file
  fs.writeFileSync(areaFile, content);
  console.log(`✅ Area synced: ${areaName}`);
  
  return areaDir;
}

// Create or update Project note
async function syncProject(
  folder: any, 
  list: any, 
  api: ClickUpAPI, 
  state: SyncState
): Promise<string> {
  const folderName = sanitizeName(folder.name);
  const listName = sanitizeName(list.name);
  const projectFolderName = `${folderName}-${listName}`;
  const projectDir = path.join(PROJECTS_DIR, projectFolderName);
  const projectFile = path.join(projectDir, `${projectFolderName}.md`);
  
  ensureDir(projectDir);
  
  // Track mapping
  state.mappings.lists[list.id] = projectDir;
  
  // Fetch tasks from ClickUp
  let tasks: any[] = [];
  try {
    tasks = await api.getTasks(list.id, { include_closed: false });
  } catch (e) {
    console.warn(`⚠️ Could not fetch tasks for list ${list.name}: ${e}`);
  }
  
  // Build project note content
  let content = `# ${list.name}\n\n`;
  content += `**Area:** [[${folderName}]]\n`;
  content += `**Status:** ${list.status?.status || 'Active'}\n`;
  content += `**ClickUp List:** [View in ClickUp](https://app.clickup.com/${list.id})\n`;
  content += `**Sync ID:** #clickup-list-${list.id}\n\n`;
  
  // Description if available
  if (list.content) {
    content += `## Description\n\n${list.content}\n\n`;
  }
  
  // Create individual task files with YAML frontmatter
  const TASKS_DIR = path.join(OBSIDIAN_VAULT, '04-Tasks');
  ensureDir(TASKS_DIR);
  
  // Process all tasks - create/update individual task files
  for (const task of tasks) {
    const taskFileName = sanitizeName(task.name).substring(0, 50);
    const taskFilePath = path.join(TASKS_DIR, `${taskFileName}.md`);
    
    // Map ClickUp priority to TaskNotes priority
    let taskPriority = 'normal';
    if (task.priority) {
      if (task.priority.priority === 'urgent') taskPriority = 'urgent';
      else if (task.priority.priority === 'high') taskPriority = 'high';
      else if (task.priority.priority === 'low') taskPriority = 'low';
    }
    
    // Map ClickUp status
    const taskStatus = task.status?.type === 'closed' ? 'done' : 'open';
    
    // Format dates
    const dueDate = task.due_date 
      ? new Date(parseInt(task.due_date)).toISOString().split('T')[0]
      : '';
    const createdDate = task.date_created 
      ? new Date(parseInt(task.date_created)).toISOString()
      : new Date().toISOString();
    const updatedDate = task.date_updated 
      ? new Date(parseInt(task.date_updated)).toISOString()
      : createdDate;
    
    // Build assignees list
    const assignees = task.assignees?.map((a: any) => a.username).join(', ') || '';
    
    // Check if task file already exists
    let existingContent = '';
    if (fs.existsSync(taskFilePath)) {
      existingContent = fs.readFileSync(taskFilePath, 'utf-8');
      // If file exists and has same clickup_id, update it
      if (existingContent.includes(`clickup_id: ${task.id}`)) {
        // Update existing task file
        const updatedContent = existingContent.replace(
          /---[\s\S]*?---/,
          `---\nstatus: ${taskStatus}\ntags:\n  - task\n  - clickup-import\npriority: ${taskPriority}\nprojects: ["[[${projectFolderName}]]"]\ndue: ${dueDate}\ndateCreated: ${createdDate}\ndateModified: ${updatedDate}\nclickup_id: ${task.id}\nclickup_url: ${task.url}\nclickup_status: ${task.status?.status || 'unknown'}\nassignees: ${assignees}\n---`
        );
        if (!dryRun) {
          fs.writeFileSync(taskFilePath, updatedContent);
        }
        continue;
      }
    }
    
    // Create new task file with full YAML frontmatter
    const taskContent = `---\nstatus: ${taskStatus}\ntags:\n  - task\n  - clickup-import\npriority: ${taskPriority}\nprojects: ["[[${projectFolderName}]]"]\ndue: ${dueDate}\ndateCreated: ${createdDate}\ndateModified: ${updatedDate}\nclickup_id: ${task.id}\nclickup_url: ${task.url}\nclickup_status: ${task.status?.status || 'unknown'}\nassignees: ${assignees}\n---\n\n# ${task.name}\n\n${task.description || ''}\n\n## ClickUp Reference\n- **Task ID:** ${task.id}\n- **URL:** ${task.url}\n- **Status:** ${task.status?.status || 'Unknown'}\n${assignees ? `- **Assignees:** ${assignees}` : ''}\n\n---\n*Imported from ClickUp on ${new Date().toISOString().split('T')[0]}*\n`;
    
    if (!dryRun) {
      fs.writeFileSync(taskFilePath, taskContent);
      console.log(`  📝 Task file: ${taskFileName}.md`);
    }
    
    // Track task mapping
    state.mappings.tasks[task.id] = taskFilePath;
  }
  
  // Tasks section in project note (embedded list for quick reference)
  content += `## Tasks\n\n`;
  
  // Open tasks
  const openTasks = tasks.filter(t => t.status?.type !== 'closed');
  if (openTasks.length > 0) {
    content += `### Open (${openTasks.length})\n\n`;
    for (const task of openTasks) {
      const taskFileName = sanitizeName(task.name).substring(0, 50);
      const dueDate = task.due_date 
        ? new Date(parseInt(task.due_date)).toISOString().split('T')[0]
        : '';
      const dueStr = dueDate ? ` — Due: ${dueDate}` : '';
      const priority = task.priority ? ` [${task.priority.priority}]` : '';
      // Link to individual task file
      content += `- [ ] [[${taskFileName}]]${dueStr}${priority} #clickup-task-${task.id}\n`;
    }
    content += '\n';
  } else {
    content += `### Open\n\n_No open tasks_\n\n`;
  }
  
  // Closed tasks (last 10)
  try {
    const closedTasks = await api.getTasks(list.id, { include_closed: true, statuses: ['closed'] });
    const recentClosed = closedTasks.slice(0, 10);
    if (recentClosed.length > 0) {
      content += `### Recently Completed (${recentClosed.length})\n\n`;
      for (const task of recentClosed) {
        const taskFileName = sanitizeName(task.name).substring(0, 50);
        content += `- [x] [[${taskFileName}]] #clickup-task-${task.id}\n`;
      }
      content += '\n';
    }
  } catch (e) {
    // Ignore errors for closed tasks
  }
  
  // Notes section
  content += `## Notes\n\n_Project notes and documentation..._\n`;
  
  // Write file
  fs.writeFileSync(projectFile, content);
  console.log(`✅ Project synced: ${projectFolderName} (${tasks.length} tasks)`);
  
  return projectFile;
}

// Sync Obsidian changes back to ClickUp
async function pushObsidianToClickUp(api: ClickUpAPI, state: SyncState) {
  console.log('\n📤 Checking for Obsidian changes to push to ClickUp...\n');
  
  // Find all project files
  const projectFiles = fs.readdirSync(PROJECTS_DIR)
    .filter(f => fs.statSync(path.join(PROJECTS_DIR, f)).isDirectory())
    .map(d => path.join(PROJECTS_DIR, d, `${d}.md`))
    .filter(f => fs.existsSync(f));
  
  for (const projectFile of projectFiles) {
    const content = fs.readFileSync(projectFile, 'utf-8');
    const listIdMatch = content.match(/#clickup-list-(\w+)/);
    
    if (!listIdMatch) continue;
    
    const listId = listIdMatch[1];
    
    // Find new tasks (checkbox items without clickup-task ID)
    const newTaskMatches = content.matchAll(/- \[ \] (.+?)(?:\n|$)/g);
    
    for (const match of newTaskMatches) {
      const taskLine = match[1].trim();
      
      // Skip if already has clickup ID
      if (taskLine.includes('#clickup-task-')) continue;
      
      // Extract task name (remove due date, priority, etc.)
      const taskName = taskLine
        .replace(/ — Due: \d{4}-\d{2}-\d{2}/, '')
        .replace(/ \[\w+\]/, '')
        .trim();
      
      // Parse due date if present
      const dueMatch = taskLine.match(/Due: (\d{4}-\d{2}-\d{2})/);
      const dueDate = dueMatch 
        ? new Date(dueMatch[1]).getTime() 
        : undefined;
      
      console.log(`  Creating ClickUp task: ${taskName}`);
      
      try {
        const newTask = await api.createTask(listId, {
          name: taskName,
          due_date: dueDate,
          description: 'Created from Obsidian'
        });
        
        // Add clickup ID to the markdown
        const updatedContent = content.replace(
          `- [ ] ${taskLine}`,
          `- [ ] ${taskLine} #clickup-task-${newTask.id}`
        );
        fs.writeFileSync(projectFile, updatedContent);
        
        console.log(`  ✅ Created: ${newTask.url}`);
      } catch (e) {
        console.error(`  ❌ Failed to create task: ${e}`);
      }
    }
    
    // Find completed tasks in Obsidian
    const completedMatches = content.matchAll(/- \[x\] (.+?)#clickup-task-(\w+)/g);
    
    for (const match of completedMatches) {
      const taskId = match[2];
      
      // Check if we already synced this completion
      const taskState = state.mappings.tasks[taskId];
      if (taskState && taskState.includes('[x]')) continue;
      
      console.log(`  Marking ClickUp task complete: ${taskId}`);
      
      try {
        await api.updateTask(taskId, { status: 'closed' });
        console.log(`  ✅ Marked complete`);
      } catch (e) {
        console.error(`  ❌ Failed to update task: ${e}`);
      }
    }
  }
}

// Main sync function
async function sync(dryRun = false, areaFilter?: string) {
  console.log('🔄 ClickUp ↔ Obsidian Sync\n');
  console.log(`Dry run: ${dryRun}`);
  console.log(`Area filter: ${areaFilter || 'All'}\n`);
  
  // Load API credentials
  const token = process.env.CLICKUP_API_TOKEN;
  const teamId = process.env.CLICKUP_TEAM_ID;
  
  if (!token || !teamId) {
    console.error('❌ CLICKUP_API_TOKEN and CLICKUP_TEAM_ID required');
    process.exit(1);
  }
  
  const api = new ClickUpAPI(token, teamId);
  const state = loadSyncState();
  
  if (dryRun) {
    console.log('🔍 DRY RUN — No changes will be made\n');
  }
  
  // Step 1: Fetch ClickUp structure
  console.log('📥 Fetching ClickUp structure...\n');
  
  const spaces = await api.getSpaces();
  console.log(`Found ${spaces.length} space(s)`);
  
  for (const space of spaces) {
    console.log(`\n📦 Space: ${space.name}`);
    
    // Get folders (areas)
    const folders = await api.getFolders(space.id);
    console.log(`  Found ${folders.length} folder(s)`);
    
    for (const folder of folders) {
      // Apply area filter if specified
      if (areaFilter && !folder.name.toLowerCase().includes(areaFilter.toLowerCase())) {
        console.log(`  ⏭️ Skipping folder: ${folder.name} (filtered)`);
        continue;
      }
      
      // Sync area
      if (!dryRun) {
        syncArea(folder, state);
      } else {
        console.log(`  📁 Would sync area: ${folder.name}`);
      }
      
      // Sync lists (projects) in this folder
      for (const list of folder.lists || []) {
        if (!dryRun) {
          await syncProject(folder, list, api, state);
        } else {
          console.log(`    📋 Would sync project: ${list.name} (${list.task_count} tasks)`);
        }
      }
    }
    
    // Also check folderless lists
    const folderlessLists = await api.getFolderlessLists(space.id);
    if (folderlessLists.length > 0) {
      console.log(`\n  📂 Folderless Lists:`);
      for (const list of folderlessLists) {
        console.log(`    📋 ${list.name} (${list.task_count} tasks)`);
      }
    }
  }
  
  // Step 2: Push Obsidian changes to ClickUp
  if (!dryRun) {
    await pushObsidianToClickUp(api, state);
  }
  
  // Save state
  if (!dryRun) {
    state.lastSync = new Date().toISOString();
    saveSyncState(state);
    console.log('\n💾 Sync state saved');
  }
  
  console.log('\n✅ Sync complete!');
}

// CLI
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const areaFilter = args.find(arg => arg.startsWith('--area='))?.split('=')[1];

sync(dryRun, areaFilter).catch(err => {
  console.error('❌ Sync failed:', err);
  process.exit(1);
});
