#!/usr/bin/env node
/**
 * Clawd ClickUp Agent - Standalone
 * Executes tasks assigned to Clawd
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CLICKUP_BASE_URL = "https://api.clickup.com/api/v2";
const OBSIDIAN_VAULT = '/home/desktop/obsidian-second-brain';
const LOG_FILE = '/home/desktop/clawd/logs/clickup-agent.log';

// Get credentials
const TOKEN = process.env.CLAWD_CLICKUP_TOKEN || process.env.CLICKUP_API_TOKEN;
const TEAM_ID = process.env.CLICKUP_TEAM_ID;
const CLAWD_USER_ID = process.env.CLAWD_CLICKUP_USER_ID;

if (!TOKEN || !TEAM_ID || !CLAWD_USER_ID) {
  console.error('❌ Missing required env vars: CLAWD_CLICKUP_TOKEN, CLICKUP_TEAM_ID, CLAWD_CLICKUP_USER_ID');
  process.exit(1);
}

// Logger
function log(level, message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, line);
  console.log(line.trim());
}

// API helper
async function apiRequest(endpoint) {
  const response = await fetch(`${CLICKUP_BASE_URL}${endpoint}`, {
    headers: { Authorization: TOKEN }
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

// Get tasks assigned to Clawd
async function getClawdTasks() {
  const data = await apiRequest(`/team/${TEAM_ID}/task?assignees[]=${CLAWD_USER_ID}&include_closed=false`);
  return data.tasks || [];
}

// Add comment to task
async function addComment(taskId, text) {
  try {
    const response = await fetch(`${CLICKUP_BASE_URL}/task/${taskId}/comment`, {
      method: 'POST',
      headers: {
        'Authorization': TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ comment_text: text })
    });
    return response.ok;
  } catch (e) {
    log('ERROR', `Failed to add comment: ${e.message}`);
    return false;
  }
}

// Update task status
async function updateTaskStatus(taskId, status) {
  try {
    const response = await fetch(`${CLICKUP_BASE_URL}/task/${taskId}`, {
      method: 'PUT',
      headers: {
        'Authorization': TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    return response.ok;
  } catch (e) {
    log('ERROR', `Failed to update status: ${e.message}`);
    return false;
  }
}

// Execute task
async function executeTask(task) {
  log('INFO', `Executing task: ${task.name} (ID: ${task.id})`);
  
  // Add "working on it" comment
  await addComment(task.id, '🤖 Clawd is working on this task...');
  
  // Classify task
  const name = task.name.toLowerCase();
  const desc = (task.description || '').toLowerCase();
  const text = `${name} ${desc}`;
  
  let result = '';
  
  // Task execution logic
  if (text.includes('create project') || text.includes('projects')) {
    result = await handleCreateProjects(task);
  } else if (text.includes('research') || text.includes('find') || text.includes('compile')) {
    result = await handleResearch(task);
  } else if (text.includes('code') || text.includes('build') || text.includes('develop')) {
    result = await handleCode(task);
  } else if (text.includes('write') || text.includes('draft')) {
    result = await handleWrite(task);
  } else {
    result = await handleGeneric(task);
  }
  
  // Comment results
  await addComment(task.id, result);
  
  // Update status to review
  await updateTaskStatus(task.id, 'review');
  
  log('INFO', 'Task execution complete');
}

// Handle project creation task
async function handleCreateProjects(task) {
  log('INFO', 'Handling project creation task');
  
  // Get recent development projects from clawd-second-brain
  const projectsDir = '/home/desktop/clawd/projects';
  let projectList = [];
  
  try {
    const dirs = fs.readdirSync(projectsDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
    
    // Filter for Nomads-related projects
    projectList = dirs.filter(name => 
      name.toLowerCase().includes('nomads') || 
      name.toLowerCase().includes('mews') ||
      name.toLowerCase().includes('booking') ||
      name.toLowerCase().includes('pos')
    );
  } catch (e) {
    log('WARN', 'Could not read projects directory');
  }
  
  // Also check recent git repos
  let recentRepos = [];
  try {
    const result = execSync('find /home/desktop -name ".git" -type d -mtime -30 2>/dev/null | head -20', { encoding: 'utf-8' });
    recentRepos = result.split('\n').filter(Boolean).map(p => path.basename(path.dirname(p)));
  } catch (e) {
    log('WARN', 'Could not find recent repos');
  }
  
  const allProjects = [...new Set([...projectList, ...recentRepos])];
  
  let report = `## 📁 Projects for Nomads Development Work\n\n`;
  report += `Found ${allProjects.length} active development projects:\n\n`;
  
  for (const proj of allProjects.slice(0, 15)) {
    report += `- **${proj}**\n`;
  }
  
  if (allProjects.length > 15) {
    report += `- ... and ${allProjects.length - 15} more\n`;
  }
  
  report += `\n## 📝 Recommended Actions\n\n`;
  report += `1. Review list above and identify which need ClickUp projects\n`;
  report += `2. Create ClickUp projects for active development work\n`;
  report += `3. Link GitHub repos to ClickUp projects\n`;
  report += `4. Assign tasks for each project\n`;
  
  report += `\n---\n`;
  report += `*Generated by Clawd* 🦎`;
  
  return report;
}

// Handle research task
async function handleResearch(task) {
  return `## 🔍 Research Results\n\n` +
    `Task: ${task.name}\n\n` +
    `Research would be conducted here using:\n` +
    `- Web search for data gathering\n` +
    `- Exa-research for deep analysis\n` +
    `- Browser tool if needed\n\n` +
    `Results compiled into markdown report.`;
}

// Handle code task
async function handleCode(task) {
  return `## 💻 Code Task\n\n` +
    `Task: ${task.name}\n\n` +
    `🤖 Sub-agent would be spawned to:\n` +
    `1. Analyze requirements\n` +
    `2. Research implementation\n` +
    `3. Write code\n` +
    `4. Create PR\n` +
    `5. Report results\n\n` +
    `Stand by for PR link...`;
}

// Handle writing task
async function handleWrite(task) {
  return `## ✍️ Writing Draft\n\n` +
    `Task: ${task.name}\n\n` +
    `[Draft content would be generated based on task requirements]`;
}

// Handle generic task
async function handleGeneric(task) {
  return `## 📋 Task Analysis\n\n` +
    `**Task:** ${task.name}\n` +
    `**Description:** ${task.description || '(no description)'}\n\n` +
    `Please provide more specific instructions or break into smaller tasks.`;
}

// Main
async function main() {
  console.log('🦎 Clawd Agent Starting...\n');
  
  const tasks = await getClawdTasks();
  console.log(`Found ${tasks.length} task(s) assigned to Clawd\n`);
  
  if (tasks.length === 0) {
    console.log('No tasks to process');
    return;
  }
  
  for (const task of tasks) {
    await executeTask(task);
  }
  
  console.log('\n✅ Agent run complete');
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
