#!/usr/bin/env node
/**
 * ClickUp → Obsidian Sync (Updated)
 * 
 * Hierarchy: Space = Area → Folder = Project → Lists = Task Groups
 * Supports multiple lists per project (Marketing, Development, etc.)
 */

const fs = require('fs');
const path = require('path');

const CLICKUP_BASE_URL = "https://api.clickup.com/api/v2";
const OBSIDIAN_VAULT = '/home/desktop/obsidian-second-brain';
const AREAS_DIR = path.join(OBSIDIAN_VAULT, '03-Areas');
const PROJECTS_DIR = path.join(OBSIDIAN_VAULT, '02-Projects');
const TASKS_DIR = path.join(OBSIDIAN_VAULT, '04-Tasks');
const INBOX_DIR = path.join(OBSIDIAN_VAULT, '00-Inbox');

const TOKEN = process.env.CLICKUP_API_KEY;
const TEAM_ID = process.env.CLICKUP_TEAM_ID;

if (!TOKEN || !TEAM_ID) {
  console.error('❌ CLICKUP_API_KEY and CLICKUP_TEAM_ID required');
  process.exit(1);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

ensureDir(AREAS_DIR);
ensureDir(PROJECTS_DIR);
ensureDir(TASKS_DIR);
ensureDir(INBOX_DIR);

async function apiRequest(endpoint) {
  const response = await fetch(`${CLICKUP_BASE_URL}${endpoint}`, {
    headers: { Authorization: TOKEN }
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}

function sanitizeName(name) {
  return name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

// Get lists inside a folder
async function getFolderLists(folderId) {
  try {
    const data = await apiRequest(`/folder/${folderId}/list`);
    return data.lists || [];
  } catch (e) { return []; }
}

// Get tasks from a list
async function getListTasks(listId) {
  try {
    const data = await apiRequest(`/list/${listId}/task?include_closed=false`);
    return data.tasks || [];
  } catch (e) { return []; }
}

// Main sync
async function sync() {
  console.log('🔄 ClickUp → Obsidian Sync');
  console.log('==========================');
  console.log('Space = Area → Folder = Project → Lists = Task Groups\n');
  
  const spaces = await apiRequest(`/team/${TEAM_ID}/space`);
  let stats = { areas: 0, projects: 0, tasks: 0, inboxNotes: 0 };
  
  for (const space of spaces.spaces || []) {
    console.log(`\n📦 ${space.name} (Space = Area)`);
    
    const areaName = sanitizeName(space.name);
    const areaFile = path.join(AREAS_DIR, `${areaName}.md`);
    
    // Create Area
    if (!fs.existsSync(areaFile)) {
      fs.writeFileSync(areaFile, `# ${space.name}\n\n**Type:** Area\n**ClickUp Space:** ${space.name}\n**Sync ID:** #clickup-space-${space.id}\n\n## Projects\n\n_Loading..._\n\n## Notes\n\n_Area overview..._\n`);
      stats.areas++;
      console.log(`  ✅ Created area: ${areaName}`);
    }
    
    // Get folders (PROJECTS)
    const folders = await apiRequest(`/space/${space.id}/folder`);
    console.log(`  Found ${folders.folders?.length || 0} project(s)`);
    
    for (const folder of folders.folders || []) {
      const isInbox = folder.name.toLowerCase() === 'inbox';
      const projectName = isInbox ? `${areaName}-Inbox` : `${areaName}-${sanitizeName(folder.name)}`;
      const projectFile = path.join(PROJECTS_DIR, projectName, `${projectName}.md`);
      
      // Create Project
      if (!fs.existsSync(projectFile)) {
        ensureDir(path.dirname(projectFile));
        
        let content = `# ${folder.name}${isInbox ? ' (Inbox)' : ''}\n\n`;
        content += `**Area:** [[${areaName}]]\n`;
        content += isInbox ? `**Type:** Inbox\n` : `**Type:** Project\n**Status:** Active\n`;
        content += `**ClickUp Folder:** [View](https://app.clickup.com/${folder.id})\n`;
        content += `**Sync ID:** #clickup-folder-${folder.id}\n\n`;
        
        if (!isInbox) {
          content += `## Description\n\n_Project overview..._\n\n`;
          content += `## Goal\n\n_What we want to achieve..._\n\n`;
          content += `## Progress\n\n### Completed\n- [ ] ...\n\n### In Progress\n- [ ] ...\n\n### Next Steps\n- [ ] ...\n\n`;
        }
        
        content += `## Tasks by List\n\n_Tasks will be organized here by ClickUp list..._\n\n`;
        content += `## References\n\n- GitHub: _Add repo..._\n\n## Notes\n\n_Ideas and notes..._\n`;
        
        fs.writeFileSync(projectFile, content);
        stats.projects++;
        console.log(`  ✅ Created project: ${projectName}`);
      }
      
      // Get lists inside folder (TASK GROUPS)
      const lists = await getFolderLists(folder.id);
      console.log(`    📋 ${lists.length} list(s)`);
      
      let tasksByList = {};
      let allTasks = [];
      
      for (const list of lists) {
        const tasks = await getListTasks(list.id);
        tasksByList[list.name] = tasks;
        allTasks = allTasks.concat(tasks);
        console.log(`      - ${list.name}: ${tasks.length} tasks`);
      }
      
      // Create task files
      for (const [listName, tasks] of Object.entries(tasksByList)) {
        for (const task of tasks) {
          const taskFile = path.join(TASKS_DIR, `${sanitizeName(task.name).substring(0, 50)}.md`);
          if (fs.existsSync(taskFile)) continue;
          
          const due = task.due?.date || '';
          const priority = task.priority?.priority || 'normal';
          const status = task.status?.type === 'closed' ? 'done' : 'open';
          
          fs.writeFileSync(taskFile, `---\nstatus: ${status}\ntags:\n  - task\n  - clickup-import\npriority: ${priority}\nprojects: ["[[${projectName}]]"]\ndue: ${due}\ndateCreated: ${new Date().toISOString()}\nclickup_id: ${task.id}\nclickup_url: ${task.url}\nclickup_list: ${listName}\nclickup_status: ${task.status?.status || 'unknown'}\n---\n\n# ${task.name}\n\n${task.description || ''}\n\n## ClickUp\n- **ID:** ${task.id}\n- **List:** ${listName}\n- **Project:** ${folder.name}\n- **URL:** ${task.url}\n`);
          stats.tasks++;
        }
      }
      
      if (allTasks.length > 0) {
        console.log(`    ✅ Created ${stats.tasks} task files`);
      }
    }
  }
  
  console.log(`\n✅ Sync Complete!`);
  console.log(`  Areas: ${stats.areas}`);
  console.log(`  Projects: ${stats.projects}`);
  console.log(`  Tasks: ${stats.tasks}`);
}

sync().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
