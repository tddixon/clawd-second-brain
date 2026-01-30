#!/usr/bin/env node
/**
 * Time Tracking Integration for ClickUp ↔ Obsidian
 * 
 * Handles:
 * - Start/stop timers in ClickUp
 * - Log time manually
 * - Sync time entries to Obsidian task files
 * - Track active timers
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const OBSIDIAN_VAULT = '/home/desktop/obsidian-second-brain';
const TASKS_DIR = path.join(OBSIDIAN_VAULT, '04-Tasks');
const TIME_LOG_FILE = path.join(OBSIDIAN_VAULT, '.clawdsync', 'time-tracking.json');

// Get ClickUp credentials
const CLICKUP_TOKEN = process.env.CLAWD_CLICKUP_TOKEN || process.env.CLICKUP_API_KEY;
const TEAM_ID = process.env.CLICKUP_TEAM_ID;

if (!CLICKUP_TOKEN || !TEAM_ID) {
  console.error('❌ CLAWD_CLICKUP_TOKEN and CLICKUP_TEAM_ID required');
  process.exit(1);
}

// Ensure time tracking log exists
function ensureTimeLog() {
  const logDir = path.dirname(TIME_LOG_FILE);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  if (!fs.existsSync(TIME_LOG_FILE)) {
    fs.writeFileSync(TIME_LOG_FILE, JSON.stringify({
      activeTimers: {},
      history: []
    }, null, 2));
  }
  return JSON.parse(fs.readFileSync(TIME_LOG_FILE, 'utf-8'));
}

function saveTimeLog(log) {
  fs.writeFileSync(TIME_LOG_FILE, JSON.stringify(log, null, 2));
}

// Find task file by ClickUp ID or name
function findTaskFile(clickupId, taskName) {
  if (clickupId) {
    const files = fs.readdirSync(TASKS_DIR).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(TASKS_DIR, file), 'utf-8');
      if (content.includes(`clickup_id: ${clickupId}`)) {
        return path.join(TASKS_DIR, file);
      }
    }
  }
  
  if (taskName) {
    const sanitized = taskName.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 50);
    const filePath = path.join(TASKS_DIR, `${sanitized}.md`);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  
  return null;
}

// Update Obsidian task file with time entry
function updateObsidianTaskTime(taskFile, timeEntry) {
  if (!fs.existsSync(taskFile)) return false;
  
  let content = fs.readFileSync(taskFile, 'utf-8');
  
  // Check if Time Tracking section exists
  if (!content.includes('## Time Tracking')) {
    content += '\n\n## Time Tracking\n\n';
    content += '| Date | Duration | Description |\n';
    content += '|------|----------|-------------|\n';
  }
  
  // Add time entry to table
  const date = timeEntry.date || new Date().toISOString().split('T')[0];
  const duration = formatDuration(timeEntry.duration);
  const description = timeEntry.description || 'Work session';
  
  // Insert after header row
  const lines = content.split('\n');
  const headerIndex = lines.findIndex(l => l.includes('|------|----------|-------------|'));
  if (headerIndex !== -1) {
    lines.splice(headerIndex + 1, 0, `| ${date} | ${duration} | ${description} |`);
    content = lines.join('\n');
  }
  
  // Update total time in YAML if possible
  const totalTime = calculateTotalTime(content);
  if (totalTime > 0) {
    content = content.replace(
      /timeSpent:.*/,
      `timeSpent: ${totalTime}`
    );
  }
  
  fs.writeFileSync(taskFile, content);
  return true;
}

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function calculateTotalTime(content) {
  const regex = /\|\s*\d{4}-\d{2}-\d{2}\s*\|\s*(\d+)h?\s*(\d*)m?/g;
  let total = 0;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const hours = parseInt(match[1]) || 0;
    const mins = parseInt(match[2]) || 0;
    total += hours * 60 + mins;
  }
  return total;
}

// Start timer using MCP
async function startTimer(clickupId, description) {
  console.log(`⏱️  Starting timer for task ${clickupId}...`);
  
  try {
    // Use mcporter to start timer
    const result = execSync(
      `mcporter call 'clickup.clickup_start_time_tracking(task_id: "${clickupId}", description: "${description || 'Working'}")'`,
      { encoding: 'utf-8', timeout: 10000 }
    );
    
    const log = ensureTimeLog();
    log.activeTimers[clickupId] = {
      startTime: new Date().toISOString(),
      description: description || 'Working',
      taskId: clickupId
    };
    saveTimeLog(log);
    
    console.log('✅ Timer started in ClickUp');
    return true;
  } catch (e) {
    console.error('❌ Failed to start timer:', e.message);
    return false;
  }
}

// Stop timer using MCP
async function stopTimer(clickupId) {
  console.log(`⏹️  Stopping timer for task ${clickupId}...`);
  
  try {
    // Use mcporter to stop timer
    const result = execSync(
      `mcporter call 'clickup.clickup_stop_time_tracking()'`,
      { encoding: 'utf-8', timeout: 10000 }
    );
    
    const log = ensureTimeLog();
    const timer = log.activeTimers[clickupId];
    
    if (timer) {
      const start = new Date(timer.startTime);
      const end = new Date();
      const duration = Math.round((end - start) / 60000); // minutes
      
      // Add to history
      log.history.push({
        taskId: clickupId,
        startTime: timer.startTime,
        endTime: end.toISOString(),
        duration: duration,
        description: timer.description
      });
      
      delete log.activeTimers[clickupId];
      saveTimeLog(log);
      
      // Update Obsidian
      const taskFile = findTaskFile(clickupId);
      if (taskFile) {
        updateObsidianTaskTime(taskFile, {
          date: new Date().toISOString().split('T')[0],
          duration: duration,
          description: timer.description
        });
        console.log(`✅ Time logged: ${formatDuration(duration)}`);
      }
    }
    
    console.log('✅ Timer stopped in ClickUp');
    return true;
  } catch (e) {
    console.error('❌ Failed to stop timer:', e.message);
    return false;
  }
}

// Add manual time entry
async function addManualTime(clickupId, duration, description, startTime, endTime) {
  console.log(`📝 Adding ${formatDuration(duration)} to task ${clickupId}...`);
  
  try {
    // Format for ClickUp (duration in ms)
    const durationMs = duration * 60 * 1000;
    const start = startTime || new Date(Date.now() - durationMs).toISOString();
    
    // Use mcporter to add time entry
    const result = execSync(
      `mcporter call 'clickup.clickup_add_time_entry(task_id: "${clickupId}", start: "${start}", duration: "${duration}m", description: "${description || 'Manual entry'}")'`,
      { encoding: 'utf-8', timeout: 10000 }
    );
    
    // Update Obsidian
    const taskFile = findTaskFile(clickupId);
    if (taskFile) {
      updateObsidianTaskTime(taskFile, {
        date: new Date().toISOString().split('T')[0],
        duration: duration,
        description: description || 'Manual entry'
      });
    }
    
    // Add to history
    const log = ensureTimeLog();
    log.history.push({
      taskId: clickupId,
      startTime: start,
      endTime: endTime || new Date().toISOString(),
      duration: duration,
      description: description || 'Manual entry'
    });
    saveTimeLog(log);
    
    console.log(`✅ Added ${formatDuration(duration)} to task`);
    return true;
  } catch (e) {
    console.error('❌ Failed to add time:', e.message);
    return false;
  }
}

// Check active timers
function checkActiveTimers() {
  const log = ensureTimeLog();
  const active = Object.values(log.activeTimers);
  
  if (active.length === 0) {
    console.log('No active timers');
    return;
  }
  
  console.log('⏱️  Active Timers:');
  for (const timer of active) {
    const start = new Date(timer.startTime);
    const now = new Date();
    const elapsed = Math.round((now - start) / 60000);
    console.log(`  Task: ${timer.taskId}`);
    console.log(`  Started: ${timer.startTime}`);
    console.log(`  Elapsed: ${formatDuration(elapsed)}`);
    console.log(`  Description: ${timer.description}`);
  }
}

// Sync time entries from ClickUp to Obsidian
async function syncTimeEntries(clickupId) {
  console.log(`🔄 Syncing time entries for task ${clickupId}...`);
  
  try {
    const result = execSync(
      `mcporter call 'clickup.clickup_get_task_time_entries(task_id: "${clickupId}")'`,
      { encoding: 'utf-8', timeout: 10000 }
    );
    
    const entries = JSON.parse(result);
    const taskFile = findTaskFile(clickupId);
    
    if (taskFile && entries.data) {
      for (const entry of entries.data) {
        const duration = Math.round(entry.duration / 60000); // ms to minutes
        updateObsidianTaskTime(taskFile, {
          date: new Date(entry.start).toISOString().split('T')[0],
          duration: duration,
          description: entry.description || 'Time entry'
        });
      }
      console.log(`✅ Synced ${entries.data.length} time entries`);
    }
    
    return true;
  } catch (e) {
    console.error('❌ Failed to sync time entries:', e.message);
    return false;
  }
}

// CLI
const args = process.argv.slice(2);
const command = args[0];

(async () => {
  switch (command) {
    case 'start':
      if (!args[1]) {
        console.error('Usage: time-tracking.js start <clickup_task_id> [description]');
        process.exit(1);
      }
      await startTimer(args[1], args[2]);
      break;
      
    case 'stop':
      if (!args[1]) {
        // Stop all active timers
        const log = ensureTimeLog();
        for (const taskId of Object.keys(log.activeTimers)) {
          await stopTimer(taskId);
        }
      } else {
        await stopTimer(args[1]);
      }
      break;
      
    case 'add':
      if (!args[1] || !args[2]) {
        console.error('Usage: time-tracking.js add <clickup_task_id> <duration_minutes> [description]');
        process.exit(1);
      }
      await addManualTime(args[1], parseInt(args[2]), args[3], args[4], args[5]);
      break;
      
    case 'status':
      checkActiveTimers();
      break;
      
    case 'sync':
      if (!args[1]) {
        console.error('Usage: time-tracking.js sync <clickup_task_id>');
        process.exit(1);
      }
      await syncTimeEntries(args[1]);
      break;
      
    default:
      console.log(`
Time Tracking for ClickUp ↔ Obsidian

Usage:
  time-tracking.js start <task_id> [description]  Start timer on task
  time-tracking.js stop [task_id]                  Stop timer (or all)
  time-tracking.js add <task_id> <minutes> [desc]  Add manual time entry
  time-tracking.js status                          Show active timers
  time-tracking.js sync <task_id>                  Sync time from ClickUp

Examples:
  time-tracking.js start 123456789 "Working on feature"
  time-tracking.js stop 123456789
  time-tracking.js add 123456789 30 "Code review"
      `);
  }
})();
