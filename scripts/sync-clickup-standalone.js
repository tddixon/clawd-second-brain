#!/usr/bin/env node
/**
 * ClickUp → Obsidian Sync (Standalone)
 * Maps ClickUp structure to Obsidian vault
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CLICKUP_BASE_URL = "https://api.clickup.com/api/v2";
const OBSIDIAN_VAULT = '/home/desktop/obsidian-second-brain';
const AREAS_DIR = path.join(OBSIDIAN_VAULT, '03-Areas');
const PROJECTS_DIR = path.join(OBSIDIAN_VAULT, '02-Projects');
const TASKS_DIR = path.join(OBSIDIAN_VAULT, '04-Tasks');
const INBOX_DIR = path.join(OBSIDIAN_VAULT, '00-Inbox');

// Get credentials from environment
const TOKEN = process.env.CLICKUP_API_KEY;
const TEAM_ID = process.env.CLICKUP_TEAM_ID;

if (!TOKEN || !TEAM_ID) {
  console.error('❌ CLICKUP_API_KEY and CLICKUP_TEAM_ID required');
  process.exit(1);
}

// Ensure directories exist
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

ensureDir(AREAS_DIR);
ensureDir(PROJECTS_DIR);
ensureDir(TASKS_DIR);
ensureDir(INBOX_DIR);

// ClickUp API helper
async function apiRequest(endpoint) {
  const response = await fetch(`${CLICKUP_BASE_URL}${endpoint}`, {
    headers: { Authorization: TOKEN }
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

// Sanitize names for filesystem
function sanitizeName(name) {
  return name
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Categorize inbox task
function categorizeInboxTask(taskName, taskDescription) {
  const text = `${taskName} ${taskDescription || ''}`.toLowerCase();
  
  const nomadsKeywords = ['nomads', 'hostel', 'bangkok', 'ao nang', 'phuket', 'chiang mai', 'guest', 'booking', 'mews', 'reception'];
  const marketingKeywords = ['marketing', 'ads', 'facebook', 'instagram', 'tiktok', 'google ads', 'campaign', 'newsletter', 'social media', 'seo', 'content'];
  const accountingKeywords = ['accounting', 'finance', 'budget', 'cashflow', 'invoice', 'tax', 'revenue', 'expense'];
  const developmentKeywords = ['code', 'website', 'booking engine', 'app', 'integration', 'api', 'development', 'clawd', 'automation'];
  const designKeywords = ['design', 'logo', 'branding', 'sign', 'poster', 'flyer'];
  const opsKeywords = ['ops', 'operations', 'staff', 'hiring', 'training', 'schedule', 'inventory'];
  
  if (nomadsKeywords.some(k => text.includes(k))) {
    if (marketingKeywords.some(k => text.includes(k))) return { project: 'Nomads-Marketing', reason: 'Marketing for Nomads' };
    if (accountingKeywords.some(k => text.includes(k))) return { project: 'Nomads-Accounting', reason: 'Accounting for Nomads' };
    if (developmentKeywords.some(k => text.includes(k))) return { project: 'Nomads-Automation', reason: 'Development/tech for Nomads' };
    if (designKeywords.some(k => text.includes(k))) return { project: 'Nomads-Design', reason: 'Design for Nomads' };
    if (opsKeywords.some(k => text.includes(k))) return { project: 'Nomads-Operations', reason: 'Operations for Nomads' };
    return { project: 'Nomads-General', reason: 'General Nomads task' };
  }
  
  const healthKeywords = ['health', 'gym', 'fitness', 'workout', 'exercise', 'doctor'];
  const travelKeywords = ['travel', 'flight', 'hotel', 'booking', 'trip', 'vacation'];
  
  if (healthKeywords.some(k => text.includes(k))) return { project: 'Personal-Health', reason: 'Health & fitness' };
  if (travelKeywords.some(k => text.includes(k))) return { project: 'Personal-Travel', reason: 'Travel task' };
  
  return { project: 'Needs-Clarification', reason: 'Unable to categorize' };
}

// Main sync function
async function sync() {
  console.log('🔄 ClickUp → Obsidian Sync');
  console.log('==========================\n');
  
  // Get spaces
  console.log('📦 Fetching spaces...');
  const spacesData = await apiRequest(`/team/${TEAM_ID}/space`);
  const spaces = spacesData.spaces || [];
  console.log(`Found ${spaces.length} spaces\n`);
  
  let areasCreated = 0;
  let projectsCreated = 0;
  let tasksCreated = 0;
  let inboxNotesCreated = 0;
  
  for (const space of spaces) {
    console.log(`📦 ${space.name}`);
    
    const areaName = sanitizeName(space.name);
    const areaDir = path.join(AREAS_DIR, areaName);
    const areaFile = path.join(areaDir, `${areaName}.md`);
    
    // Create area
    if (!fs.existsSync(areaFile)) {
      ensureDir(areaDir);
      fs.writeFileSync(areaFile, `# ${space.name}\n\n**Type:** Area\n**ClickUp Space:** ${space.name}\n**Sync ID:** #clickup-space-${space.id}\n\n## Projects\n\n_Loading..._\n\n## Notes\n\n_Area overview..._\n`);
      areasCreated++;
      console.log(`  ✅ Created area: ${areaName}`);
    }
    
    // Get folders
    let foldersData;
    try {
      foldersData = await apiRequest(`/space/${space.id}/folder`);
    } catch (e) {
      foldersData = { folders: [] };
    }
    const folders = foldersData.folders || [];
    
    // Get folderless lists
    let listsData;
    try {
      listsData = await apiRequest(`/space/${space.id}/list`);
    } catch (e) {
      listsData = { lists: [] };
    }
    const folderlessLists = listsData.lists || [];
    
    // Process folderless lists (these become projects)
    for (const list of folderlessLists) {
      const isInbox = list.name.toLowerCase() === 'inbox';
      const projectName = isInbox ? `${areaName}-Inbox` : `${areaName}-${sanitizeName(list.name)}`;
      const projectDir = path.join(PROJECTS_DIR, projectName);
      const projectFile = path.join(projectDir, `${projectName}.md`);
      
      if (!fs.existsSync(projectFile)) {
        ensureDir(projectDir);
        
        let content = `# ${list.name}${isInbox ? ' (Inbox)' : ''}\n\n`;
        content += `**Area:** [[${areaName}]]\n`;
        if (isInbox) {
          content += `**Type:** Inbox — Tasks here need organization\n`;
        } else {
          content += `**Status:** Active\n`;
        }
        content += `**ClickUp List:** [View in ClickUp](https://app.clickup.com/${list.id})\n`;
        content += `**Sync ID:** #clickup-list-${list.id}\n\n`;
        
        if (isInbox) {
          content += `## How to Use This Inbox\n\n`;
          content += `1. **Capture** tasks here when unsure of project\n`;
          content += `2. **Review** the organization note (auto-generated)\n`;
          content += `3. **Move** tasks to appropriate projects\n\n`;
        }
        
        content += `## Tasks\n\n_Loading from ClickUp..._\n\n`;
        content += `## Notes\n\n_Project notes..._\n`;
        
        fs.writeFileSync(projectFile, content);
        projectsCreated++;
        console.log(`  ✅ Created project: ${projectName}`);
      }
      
      // Fetch and process tasks
      if (list.task_count > 0) {
        console.log(`  📥 Fetching ${list.task_count} tasks from ${list.name}...`);
        
        let tasksData;
        try {
          tasksData = await apiRequest(`/list/${list.id}/task?include_closed=false`);
        } catch (e) {
          tasksData = { tasks: [] };
        }
        const tasks = tasksData.tasks || [];
        
        // Handle Inbox specially
        if (isInbox && tasks.length > 0) {
          const inboxNoteFile = path.join(INBOX_DIR, `${areaName}-Inbox-Organization.md`);
          
          // Categorize tasks
          const categorized = {};
          const unclear = [];
          
          for (const task of tasks) {
            const cat = categorizeInboxTask(task.name, task.description);
            if (cat.project === 'Needs-Clarification') {
              unclear.push({ task, cat });
            } else {
              if (!categorized[cat.project]) categorized[cat.project] = [];
              categorized[cat.project].push({ task, cat });
            }
          }
          
          // Build organization note
          let noteContent = `# ${areaName} Inbox Organization\n\n`;
          noteContent += `**Total Tasks:** ${tasks.length}\n`;
          noteContent += `**Generated:** ${new Date().toISOString().split('T')[0]}\n\n`;
          noteContent += `> Review and move tasks to appropriate projects\n\n`;
          
          for (const [proj, items] of Object.entries(categorized)) {
            noteContent += `## ${proj} (${items.length})\n\n`;
            for (const { task } of items) {
              const due = task.due?.date || 'No due';
              noteContent += `- [ ] **${task.name}** — Due: ${due} [Move](https://app.clickup.com/t/${task.id})\n`;
            }
            noteContent += '\n';
          }
          
          if (unclear.length > 0) {
            noteContent += `## ⚠️ Needs Clarification (${unclear.length})\n\n`;
            for (const { task } of unclear) {
              noteContent += `- [ ] **${task.name}** — [View](https://app.clickup.com/t/${task.id})\n`;
            }
          }
          
          fs.writeFileSync(inboxNoteFile, noteContent);
          inboxNotesCreated++;
          console.log(`  📝 Created inbox organization note (${tasks.length} tasks)`);
        }
        
        // Create individual task files
        for (const task of tasks) {
          const taskFileName = sanitizeName(task.name).substring(0, 50);
          const taskFile = path.join(TASKS_DIR, `${taskFileName}.md`);
          
          if (fs.existsSync(taskFile)) continue;
          
          const dueDate = task.due?.date || '';
          const priority = task.priority?.priority || 'normal';
          const status = task.status?.type === 'closed' ? 'done' : 'open';
          
          let content = `---\n`;
          content += `status: ${status}\n`;
          content += `tags:\n  - task\n  - clickup-import\n`;
          content += `priority: ${priority}\n`;
          content += `projects: ["[[${projectName}]]"]\n`;
          content += `due: ${dueDate}\n`;
          content += `dateCreated: ${new Date().toISOString()}\n`;
          content += `dateModified: ${new Date().toISOString()}\n`;
          content += `clickup_id: ${task.id}\n`;
          content += `clickup_url: ${task.url}\n`;
          content += `clickup_status: ${task.status?.status || 'unknown'}\n`;
          content += `---\n\n`;
          content += `# ${task.name}\n\n`;
          content += `${task.description || ''}\n\n`;
          content += `## ClickUp Reference\n`;
          content += `- **Task ID:** ${task.id}\n`;
          content += `- **URL:** ${task.url}\n`;
          content += `- **Status:** ${task.status?.status || 'Unknown'}\n`;
          
          fs.writeFileSync(taskFile, content);
          tasksCreated++;
        }
        
        console.log(`  ✅ Created ${tasks.length} task files`);
      }
    }
    
    console.log('');
  }
  
  console.log('==========================');
  console.log('✅ Sync Complete!');
  console.log(`  Areas created: ${areasCreated}`);
  console.log(`  Projects created: ${projectsCreated}`);
  console.log(`  Tasks created: ${tasksCreated}`);
  console.log(`  Inbox notes: ${inboxNotesCreated}`);
  console.log('==========================');
}

sync().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
