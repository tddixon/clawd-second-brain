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
const ERROR_LOG_FILE = '/home/desktop/clawd/logs/clawd-agent-errors.log';

// Ensure logs directory exists
const logsDir = path.dirname(ERROR_LOG_FILE);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Get credentials
const TOKEN = process.env.CLAWD_CLICKUP_TOKEN || process.env.CLICKUP_API_TOKEN;
const TEAM_ID = process.env.CLICKUP_TEAM_ID;
const CLAWD_USER_ID = process.env.CLAWD_CLICKUP_USER_ID;

if (!TOKEN || !TEAM_ID || !CLAWD_USER_ID) {
  console.error('❌ Missing required env vars: CLAWD_CLICKUP_TOKEN, CLICKUP_TEAM_ID, CLAWD_CLICKUP_USER_ID');
  process.exit(2);
}

// Logger with error tracking
function log(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, line);
  console.log(line.trim());
  
  // Log errors with full details
  if (level === 'ERROR') {
    const errorLog = ERROR_LOG_FILE;
    const jsonLog = path.join(logsDir, 'clawd-agent-errors.jsonl');
    const entry = { timestamp, level, message, ...data };
    
    fs.appendFileSync(errorLog, line);
    fs.appendFileSync(jsonLog, JSON.stringify(entry) + '\n');
  }
}

// Retry utility with exponential backoff
async function retryWithBackoff(fn, maxAttempts = 3, context = 'operation') {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        log('ERROR', `${context} failed after ${maxAttempts} attempts`, {
          error: error.message,
          stack: error.stack
        });
        throw error;
      }
      
      const backoffMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      log('WARN', `${context} failed (attempt ${attempt}/${maxAttempts}), retrying in ${backoffMs/1000}s...`);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }
}

// Health check for ClickUp API
async function healthCheck() {
  try {
    await retryWithBackoff(
      async () => await apiRequest('/user'),
      3,
      'ClickUp API health check'
    );
    log('INFO', 'ClickUp API health check passed');
    return true;
  } catch (error) {
    log('ERROR', 'ClickUp API health check failed', {
      error: error.message,
      stack: error.stack
    });
    return false;
  }
}

// API helper with error handling
async function apiRequest(endpoint) {
  return retryWithBackoff(async () => {
    const response = await fetch(`${CLICKUP_BASE_URL}${endpoint}`, {
      headers: { Authorization: TOKEN }
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return response.json();
  }, 3, `API request ${endpoint}`);
}

// Get tasks assigned to Clawd
async function getClawdTasks() {
  try {
    const data = await apiRequest(`/team/${TEAM_ID}/task?assignees[]=${CLAWD_USER_ID}&include_closed=false`);
    return data.tasks || [];
  } catch (error) {
    log('ERROR', 'Failed to get Clawd tasks', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
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
    log('ERROR', `Failed to add comment to task ${taskId}`, {
      error: e.message,
      stack: e.stack
    });
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
    log('ERROR', `Failed to update status for task ${taskId}`, {
      error: e.message,
      stack: e.stack
    });
    return false;
  }
}

// Execute task
async function executeTask(task) {
  log('INFO', `Executing task: ${task.name} (ID: ${task.id})`);
  
  try {
    // Add "working on it" comment
    await retryWithBackoff(
      async () => await addComment(task.id, '🤖 Clawd is working on this task...'),
      3,
      `Add working comment to task ${task.id}`
    );
  } catch (e) {
    log('WARN', 'Could not add working comment, continuing anyway');
  }
  
  // Classify task
  const name = task.name.toLowerCase();
  const desc = (task.description || '').toLowerCase();
  const text = `${name} ${desc}`;
  
  let result = '';
  
  try {
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
    await retryWithBackoff(
      async () => await addComment(task.id, result),
      3,
      `Add result comment to task ${task.id}`
    );
    
    // Update status to review
    await retryWithBackoff(
      async () => await updateTaskStatus(task.id, 'review'),
      3,
      `Update status for task ${task.id}`
    );
    
    log('INFO', 'Task execution complete');
    return true;
    
  } catch (error) {
    log('ERROR', `Task execution failed for ${task.id}`, {
      error: error.message,
      stack: error.stack,
      taskName: task.name
    });
    
    // Try to comment the error
    try {
      await addComment(task.id, `❌ Task execution failed: ${error.message}\n\nPlease check logs for details.`);
    } catch (e) {
      log('ERROR', 'Could not add error comment to task');
    }
    
    return false;
  }
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
  
  let hasErrors = false;
  
  try {
    // Health check
    const healthy = await healthCheck();
    if (!healthy) {
      console.error('❌ ClickUp API is not accessible - aborting');
      process.exit(2);
    }
    
    const tasks = await getClawdTasks();
    console.log(`Found ${tasks.length} task(s) assigned to Clawd\n`);
    
    if (tasks.length === 0) {
      console.log('No tasks to process');
      return;
    }
    
    for (const task of tasks) {
      const success = await executeTask(task);
      if (!success) {
        hasErrors = true;
      }
    }
    
    console.log('\n✅ Agent run complete');
    
    // Exit with appropriate code
    if (hasErrors) {
      log('WARN', 'Agent completed with errors');
      process.exit(1);
    }
    
  } catch (err) {
    log('ERROR', `Fatal error: ${err.message}`, {
      error: err.message,
      stack: err.stack
    });
    console.error('❌ Error:', err);
    process.exit(2);
  }
}

main();
