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
const ERROR_LOG_FILE = '/home/desktop/clawd/logs/time-tracking-errors.log';

// Ensure logs directory exists
const logsDir = path.dirname(ERROR_LOG_FILE);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Error logging utility
function logError(context, error, data = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    context,
    error: error.message || String(error),
    stack: error.stack,
    data
  };
  
  const logLine = `[${timestamp}] ${context}: ${error.message || error}\n`;
  fs.appendFileSync(ERROR_LOG_FILE, logLine);
  
  // Also log full details as JSON for debugging
  const jsonLog = path.join(logsDir, 'time-tracking-errors.jsonl');
  fs.appendFileSync(jsonLog, JSON.stringify(logEntry) + '\n');
}

// Retry utility with exponential backoff
async function retryWithBackoff(fn, maxAttempts = 3, context = 'operation') {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        logError(context, error, { attempts: attempt });
        throw error;
      }
      
      const backoffMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      console.warn(`⚠️  ${context} failed (attempt ${attempt}/${maxAttempts}), retrying in ${backoffMs/1000}s...`);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }
}

// Health check for ClickUp API
async function healthCheck() {
  if (!CLICKUP_TOKEN || !TEAM_ID) {
    throw new Error('Missing CLICKUP credentials (CLAWD_CLICKUP_TOKEN, CLICKUP_TEAM_ID)');
  }
  
  try {
    // Simple API call to verify connectivity
    execSync(
      `curl -s -H "Authorization: ${CLICKUP_TOKEN}" https://api.clickup.com/api/v2/team`,
      { timeout: 5000 }
    );
    return true;
  } catch (error) {
    logError('Health check', error);
    throw new Error('ClickUp API is not accessible');
  }
}

// Get ClickUp credentials
const CLICKUP_TOKEN = process.env.CLAWD_CLICKUP_TOKEN || process.env.CLICKUP_API_KEY;
const TEAM_ID = process.env.CLICKUP_TEAM_ID;

if (!CLICKUP_TOKEN || !TEAM_ID) {
  console.error('❌ CLAWD_CLICKUP_TOKEN and CLICKUP_TEAM_ID required');
  process.exit(2); // Exit code 2 = configuration error
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
  const entries = parseObsidianTimeEntries(content);
  return entries.reduce((total, entry) => total + entry.duration, 0);
}

// Get total time from local log for a specific task
function getTaskTotalTime(clickupId) {
  const log = ensureTimeLog();
  let total = 0;
  
  // Sum history entries
  for (const entry of log.history) {
    if (entry.taskId === clickupId) {
      total += entry.duration;
    }
  }
  
  // Add active timer time
  if (log.activeTimers[clickupId]) {
    const start = new Date(log.activeTimers[clickupId].startTime);
    const now = new Date();
    const elapsed = Math.round((now - start) / 60000);
    total += elapsed;
  }
  
  return total;
}

// Start timer using MCP
async function startTimer(clickupId, description) {
  console.log(`⏱️  Starting timer for task ${clickupId}...`);
  
  return retryWithBackoff(async () => {
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
      logError('Start timer', e, { clickupId, description });
      console.error('❌ Failed to start timer:', e.message);
      throw e;
    }
  }, 3, `Start timer ${clickupId}`).catch(() => false);
}

// Stop timer using MCP
async function stopTimer(clickupId) {
  console.log(`⏹️  Stopping timer for task ${clickupId}...`);
  
  return retryWithBackoff(async () => {
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
      logError('Stop timer', e, { clickupId });
      console.error('❌ Failed to stop timer:', e.message);
      throw e;
    }
  }, 3, `Stop timer ${clickupId}`).catch(() => false);
}

// Add manual time entry
async function addManualTime(clickupId, duration, description, startTime, endTime) {
  console.log(`📝 Adding ${formatDuration(duration)} to task ${clickupId}...`);
  
  return retryWithBackoff(async () => {
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
      logError('Add manual time', e, { clickupId, duration, description });
      console.error('❌ Failed to add time:', e.message);
      throw e;
    }
  }, 3, `Add manual time ${clickupId}`).catch(() => false);
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

// Parse time entries from Obsidian task file
function parseObsidianTimeEntries(content) {
  const entries = [];
  
  // Match table rows: | Date | Duration | Description |
  const tableRegex = /\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|/g;
  let match;
  
  while ((match = tableRegex.exec(content)) !== null) {
    // Skip header separator row
    if (match[1].includes('--')) continue;
    
    const date = match[1];
    const durationStr = match[2].trim();
    const description = match[3].trim();
    
    // Parse duration (e.g., "1h 30m" or "45m" or "2h")
    let minutes = 0;
    const hourMatch = durationStr.match(/(\d+)h/);
    const minMatch = durationStr.match(/(\d+)m/);
    
    if (hourMatch) minutes += parseInt(hourMatch[1]) * 60;
    if (minMatch) minutes += parseInt(minMatch[1]);
    if (!hourMatch && !minMatch) {
      // Try parsing as plain number (assume minutes)
      const numMatch = durationStr.match(/(\d+)/);
      if (numMatch) minutes = parseInt(numMatch[1]);
    }
    
    if (minutes > 0) {
      entries.push({ date, duration: minutes, description });
    }
  }
  
  return entries;
}

// Sync time from Obsidian to ClickUp (bidirectional)
async function syncObsidianToClickUp(taskFile) {
  if (!fs.existsSync(taskFile)) {
    console.error(`❌ Task file not found: ${taskFile}`);
    return false;
  }
  
  const content = fs.readFileSync(taskFile, 'utf-8');
  
  // Get ClickUp ID from frontmatter
  const clickupIdMatch = content.match(/clickup_id:\s*(\d+)/);
  if (!clickupIdMatch) {
    console.error('❌ No clickup_id found in task file');
    return false;
  }
  
  const clickupId = clickupIdMatch[1];
  
  // Parse time entries from Obsidian
  const obsidianEntries = parseObsidianTimeEntries(content);
  
  if (obsidianEntries.length === 0) {
    console.log('ℹ️  No time entries found in Obsidian');
    return true;
  }
  
  console.log(`📝 Found ${obsidianEntries.length} time entries in Obsidian`);
  
  // Get existing ClickUp time entries
  let clickupEntries = [];
  try {
    const result = execSync(
      `mcporter call 'clickup.clickup_get_task_time_entries(task_id: "${clickupId}")'`,
      { encoding: 'utf-8', timeout: 10000 }
    );
    const data = JSON.parse(result);
    clickupEntries = data.data || [];
  } catch (e) {
    console.warn('⚠️  Could not fetch ClickUp time entries:', e.message);
  }
  
  // Add missing entries to ClickUp
  let added = 0;
  for (const entry of obsidianEntries) {
    // Check if similar entry already exists in ClickUp (same date + similar duration)
    const exists = clickupEntries.some(ce => {
      const ceDate = new Date(ce.start).toISOString().split('T')[0];
      const ceDuration = Math.round(ce.duration / 60000);
      return ceDate === entry.date && Math.abs(ceDuration - entry.duration) < 5;
    });
    
    if (!exists) {
      try {
        const startTime = new Date(entry.date);
        const startIso = startTime.toISOString();
        
        execSync(
          `mcporter call 'clickup.clickup_add_time_entry(task_id: "${clickupId}", start: "${startIso}", duration: "${entry.duration}m", description: "${entry.description}")'`,
          { encoding: 'utf-8', timeout: 10000 }
        );
        added++;
        console.log(`  ✅ Added: ${entry.date} - ${formatDuration(entry.duration)} - ${entry.description}`);
      } catch (e) {
        console.error(`  ❌ Failed to add entry: ${e.message}`);
      }
    }
  }
  
  console.log(`✅ Synced ${added} new time entries to ClickUp`);
  return true;
}

// Sync all task files (cron-friendly)
async function syncAllTaskFiles() {
  console.log('🔄 Syncing time from all Obsidian task files to ClickUp...\n');
  
  const files = fs.readdirSync(TASKS_DIR).filter(f => f.endsWith('.md'));
  let synced = 0;
  let errors = 0;
  
  for (const file of files) {
    const taskFile = path.join(TASKS_DIR, file);
    const content = fs.readFileSync(taskFile, 'utf-8');
    
    // Only sync files with time tracking section and clickup_id
    if (content.includes('## Time Tracking') && content.includes('clickup_id:')) {
      try {
        await syncObsidianToClickUp(taskFile);
        synced++;
      } catch (e) {
        console.error(`❌ Error syncing ${file}:`, e.message);
        errors++;
      }
    }
  }
  
  console.log(`\n✅ Sync complete: ${synced} files synced, ${errors} errors`);
}

// Get daily summary of time tracked
function getDailySummary(date) {
  const targetDate = date || new Date().toISOString().split('T')[0];
  const log = ensureTimeLog();
  
  // Filter history entries for the target date
  const dayEntries = log.history.filter(entry => {
    const entryDate = new Date(entry.startTime).toISOString().split('T')[0];
    return entryDate === targetDate;
  });
  
  // Group by task
  const byTask = {};
  for (const entry of dayEntries) {
    if (!byTask[entry.taskId]) {
      byTask[entry.taskId] = {
        taskId: entry.taskId,
        totalMinutes: 0,
        entries: []
      };
    }
    byTask[entry.taskId].totalMinutes += entry.duration;
    byTask[entry.taskId].entries.push(entry);
  }
  
  // Calculate total
  const totalMinutes = dayEntries.reduce((sum, e) => sum + e.duration, 0);
  
  return {
    date: targetDate,
    totalMinutes,
    totalFormatted: formatDuration(totalMinutes),
    tasks: Object.values(byTask),
    entryCount: dayEntries.length
  };
}

// Get weekly summary of time tracked
function getWeeklySummary(weekStart) {
  const startDate = weekStart ? new Date(weekStart) : getWeekStart(new Date());
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7);
  
  const log = ensureTimeLog();
  
  // Filter history entries for the week
  const weekEntries = log.history.filter(entry => {
    const entryDate = new Date(entry.startTime);
    return entryDate >= startDate && entryDate < endDate;
  });
  
  // Group by day
  const byDay = {};
  for (const entry of weekEntries) {
    const day = new Date(entry.startTime).toISOString().split('T')[0];
    if (!byDay[day]) {
      byDay[day] = {
        date: day,
        totalMinutes: 0,
        entries: []
      };
    }
    byDay[day].totalMinutes += entry.duration;
    byDay[day].entries.push(entry);
  }
  
  // Group by task
  const byTask = {};
  for (const entry of weekEntries) {
    if (!byTask[entry.taskId]) {
      byTask[entry.taskId] = {
        taskId: entry.taskId,
        totalMinutes: 0,
        entries: []
      };
    }
    byTask[entry.taskId].totalMinutes += entry.duration;
    byTask[entry.taskId].entries.push(entry);
  }
  
  const totalMinutes = weekEntries.reduce((sum, e) => sum + e.duration, 0);
  
  return {
    weekStart: startDate.toISOString().split('T')[0],
    weekEnd: endDate.toISOString().split('T')[0],
    totalMinutes,
    totalFormatted: formatDuration(totalMinutes),
    byDay: Object.values(byDay),
    byTask: Object.values(byTask),
    entryCount: weekEntries.length
  };
}

// Helper: Get Monday of current week
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  return new Date(d.setDate(diff));
}

// Print daily summary
function printDailySummary(date) {
  const summary = getDailySummary(date);
  
  console.log(`\n📊 Daily Summary: ${summary.date}`);
  console.log(`Total Time: ${summary.totalFormatted} (${summary.entryCount} entries)\n`);
  
  if (summary.tasks.length === 0) {
    console.log('No time tracked today.');
    return;
  }
  
  console.log('By Task:');
  for (const task of summary.tasks) {
    console.log(`  ${task.taskId}: ${formatDuration(task.totalMinutes)} (${task.entries.length} entries)`);
  }
}

// Print weekly summary
function printWeeklySummary(weekStart) {
  const summary = getWeeklySummary(weekStart);
  
  console.log(`\n📊 Weekly Summary: ${summary.weekStart} to ${summary.weekEnd}`);
  console.log(`Total Time: ${summary.totalFormatted} (${summary.entryCount} entries)\n`);
  
  if (summary.byDay.length === 0) {
    console.log('No time tracked this week.');
    return;
  }
  
  console.log('By Day:');
  for (const day of summary.byDay) {
    console.log(`  ${day.date}: ${formatDuration(day.totalMinutes)}`);
  }
  
  console.log('\nBy Task:');
  for (const task of summary.byTask) {
    console.log(`  ${task.taskId}: ${formatDuration(task.totalMinutes)}`);
  }
}

// CLI
const args = process.argv.slice(2);
const command = args[0];

(async () => {
  let exitCode = 0;
  
  try {
    // Run health check for API commands
    const apiCommands = ['start', 'stop', 'add', 'sync', 'sync-all'];
    if (apiCommands.includes(command)) {
      try {
        await healthCheck();
      } catch (error) {
        console.error('❌ Health check failed:', error.message);
        console.error('💡 Verify your ClickUp API credentials and network connection');
        process.exit(2);
      }
    }
    
    switch (command) {
      case 'start':
        if (!args[1]) {
          console.error('Usage: time-tracking.js start <clickup_task_id> [description]');
          process.exit(2);
        }
        const startResult = await startTimer(args[1], args[2]);
        exitCode = startResult ? 0 : 1;
        break;
        
      case 'stop':
        if (!args[1]) {
          // Stop all active timers
          const log = ensureTimeLog();
          const taskIds = Object.keys(log.activeTimers);
          if (taskIds.length === 0) {
            console.log('No active timers to stop');
            break;
          }
          let allSuccess = true;
          for (const taskId of taskIds) {
            const result = await stopTimer(taskId);
            if (!result) allSuccess = false;
          }
          exitCode = allSuccess ? 0 : 1;
        } else {
          const stopResult = await stopTimer(args[1]);
          exitCode = stopResult ? 0 : 1;
        }
        break;
        
      case 'add':
        if (!args[1] || !args[2]) {
          console.error('Usage: time-tracking.js add <clickup_task_id> <duration_minutes> [description]');
          process.exit(2);
        }
        const addResult = await addManualTime(args[1], parseInt(args[2]), args[3], args[4], args[5]);
        exitCode = addResult ? 0 : 1;
        break;
        
      case 'status':
        checkActiveTimers();
        break;
        
      case 'sync':
        if (!args[1]) {
          console.error('Usage: time-tracking.js sync <clickup_task_id>');
          process.exit(2);
        }
        const syncResult = await syncTimeEntries(args[1]);
        exitCode = syncResult ? 0 : 1;
        break;
        
      case 'sync-all':
        await syncAllTaskFiles();
        break;
        
      case 'daily-summary':
        printDailySummary(args[1]); // Optional date argument
        break;
        
      case 'weekly-summary':
        printWeeklySummary(args[1]); // Optional week start date argument
        break;
        
      case 'total':
        if (!args[1]) {
          console.error('Usage: time-tracking.js total <clickup_task_id>');
          process.exit(2);
        }
        const total = getTaskTotalTime(args[1]);
        console.log(`Total time for task ${args[1]}: ${formatDuration(total)}`);
        break;
        
      case 'health':
        await healthCheck();
        console.log('✅ ClickUp API is accessible');
        break;
        
      default:
        console.log(`
Time Tracking for ClickUp ↔ Obsidian

Usage:
  time-tracking.js start <task_id> [description]    Start timer on task
  time-tracking.js stop [task_id]                    Stop timer (or all active)
  time-tracking.js add <task_id> <minutes> [desc]    Add manual time entry
  time-tracking.js status                            Show active timers
  time-tracking.js sync <task_id>                    Sync time from ClickUp to Obsidian
  time-tracking.js sync-all                          Sync all task files to ClickUp
  time-tracking.js daily-summary [date]              Show daily time summary (YYYY-MM-DD)
  time-tracking.js weekly-summary [week-start]       Show weekly time summary
  time-tracking.js total <task_id>                   Show total time for task
  time-tracking.js health                            Check ClickUp API connectivity

Examples:
  time-tracking.js start 123456789 "Working on feature"
  time-tracking.js stop 123456789
  time-tracking.js add 123456789 30 "Code review"
  time-tracking.js daily-summary 2024-01-15
  time-tracking.js weekly-summary
  time-tracking.js sync-all
  time-tracking.js total 123456789

Exit Codes:
  0 = Success
  1 = Partial failure (operation attempted but failed)
  2 = Configuration error or invalid usage
      `);
    }
    
    process.exit(exitCode);
    
  } catch (error) {
    logError('CLI execution', error, { command, args });
    console.error('❌ Fatal error:', error.message);
    process.exit(2);
  }
})();
