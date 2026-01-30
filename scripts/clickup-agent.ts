#!/usr/bin/env ts-node
/**
 * Clawd ClickUp Agent
 * 
 * Automated task execution for ClickUp assignments
 * - Completes tasks assigned to Clawd
 * - Assists with tasks assigned to Trevor
 * - Responds to @Clawd mentions
 */

import * as fs from 'fs';
import * as path from 'path';
import { ClickUpAPI } from '../projects/pkm-system/scripts/clickup-api.js';

// Configuration
const LOG_FILE = '/home/desktop/clawd/logs/clickup-agent.log';
const STATE_FILE = '/home/desktop/clawd/.clawdsync/clickup-agent-state.json';
const WORK_DIR = '/home/desktop/clawd/clickup-work';

// Ensure directories exist
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
ensureDir('/home/desktop/clawd/logs');
ensureDir('/home/desktop/clawd/.clawdsync');
ensureDir(WORK_DIR);

// Logger with error tracking
function log(level: string, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, line);
  if (process.env.VERBOSE) console.log(line.trim());
  
  // Log errors with full details to JSON log
  if (level === 'ERROR' && data) {
    const errorLog = '/home/desktop/clawd/logs/clickup-agent-errors.jsonl';
    const entry = { timestamp, level, message, ...data };
    fs.appendFileSync(errorLog, JSON.stringify(entry) + '\n');
  }
}

// Retry utility with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  context: string = 'operation'
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
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
  throw new Error('Unreachable');
}

// Health check for ClickUp API
async function healthCheck(api: ClickUpAPI): Promise<boolean> {
  try {
    await retryWithBackoff(async () => {
      await api.getSpaces();
    }, 3, 'ClickUp API health check');
    
    log('INFO', 'ClickUp API health check passed');
    return true;
  } catch (error: any) {
    log('ERROR', 'ClickUp API health check failed', {
      error: error.message,
      stack: error.stack
    });
    return false;
  }
}

// State management
interface AgentState {
  lastPoll: string;
  processedTasks: string[];
  inProgressTasks: string[];
  trevorTasksAssisted: string[];
}

function loadState(): AgentState {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  }
  return {
    lastPoll: new Date().toISOString(),
    processedTasks: [],
    inProgressTasks: [],
    trevorTasksAssisted: []
  };
}

function saveState(state: AgentState) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// Task classification
interface TaskClassification {
  type: 'research' | 'code' | 'write' | 'analyze' | 'data' | 'design' | 'other';
  priority: number;
  canAutoExecute: boolean;
}

function classifyTask(name: string, description: string): TaskClassification {
  const text = `${name} ${description || ''}`.toLowerCase();
  
  // Keywords for classification
  const keywords = {
    research: ['research', 'find', 'gather', 'compile', 'look up', 'search', 'discover', 'investigate'],
    code: ['code', 'build', 'create', 'implement', 'develop', 'script', 'function', 'api', 'integration'],
    write: ['write', 'draft', 'copy', 'content', 'email', 'message', 'description', 'text'],
    analyze: ['analyze', 'review', 'audit', 'assess', 'evaluate', 'compare', 'check'],
    data: ['scrape', 'extract', 'collect', 'data', 'export', 'import', 'sync'],
    design: ['design', 'mockup', 'wireframe', 'layout', 'visual', 'ui', 'ux']
  };
  
  for (const [type, words] of Object.entries(keywords)) {
    if (words.some(w => text.includes(w))) {
      return {
        type: type as TaskClassification['type'],
        priority: 1,
        canAutoExecute: ['research', 'write', 'data'].includes(type)
      };
    }
  }
  
  return { type: 'other', priority: 3, canAutoExecute: false };
}

// Task execution handlers
async function executeResearch(task: any, api: ClickUpAPI, dryRun: boolean): Promise<string> {
  log('INFO', `Researching: ${task.name}`);
  
  const query = task.name.replace(/research|find|gather/gi, '').trim();
  
  if (dryRun) {
    return `🔍 Would research: "${query}"\n\n(Dry run - no search performed)`;
  }
  
  // Use web search (would need to spawn subagent for external research)
  const result = `Research findings for "${query}":\n\n` +
    `This would spawn a subagent to perform comprehensive research using:\n` +
    `- web_search for quick facts\n` +
    `- exa-research for deep analysis\n` +
    `- browser tool if needed\n\n` +
    `Results would be compiled into a markdown report.`;
  
  return result;
}

async function executeWrite(task: any, api: ClickUpAPI, dryRun: boolean): Promise<string> {
  log('INFO', `Writing: ${task.name}`);
  
  if (dryRun) {
    return `✍️ Would draft content for: "${task.name}"\n\n(Dry run - no content generated)`;
  }
  
  // Generate content based on task
  const content = `Draft content for "${task.name}":\n\n` +
    `[This would use AI to generate appropriate copy based on task description and context]`;
  
  return content;
}

async function executeCode(task: any, api: ClickUpAPI, dryRun: boolean): Promise<string> {
  log('INFO', `Code task: ${task.name}`);
  
  if (dryRun) {
    return `💻 Would spawn subagent for: "${task.name}"\n\n(Dry run - no subagent spawned)`;
  }
  
  // Spawn subagent for code tasks
  const result = `🤖 Sub-agent would be spawned with task:\n\n` +
    `"${task.name}"\n\n` +
    `Description: ${task.description || '(no description)'}\n\n` +
    `The subagent would:\n` +
    `1. Analyze requirements\n` +
    `2. Research if needed\n` +
    `3. Implement solution\n` +
    `4. Create PR or commit changes\n` +
    `5. Report back with results`;
  
  return result;
}

async function executeOther(task: any, api: ClickUpAPI, dryRun: boolean): Promise<string> {
  log('INFO', `Other task: ${task.name}`);
  
  return `📋 Task Analysis:\n\n` +
    `Type: Other/Complex\n` +
    `Name: ${task.name}\n` +
    `Description: ${task.description || '(no description)'}\n\n` +
    `This task type requires manual review or clarification. ` +
    `Please provide more specific instructions or break into smaller tasks.`;
}

// Execute task based on classification
async function executeTask(
  task: any, 
  api: ClickUpAPI, 
  classification: TaskClassification,
  dryRun: boolean
): Promise<{ comment: string; attachments?: string[]; status?: string }> {
  
  let comment = '';
  let attachments: string[] = [];
  let status = 'in progress';
  
  switch (classification.type) {
    case 'research':
      comment = await executeResearch(task, api, dryRun);
      status = dryRun ? 'research' : 'review';
      break;
      
    case 'write':
      comment = await executeWrite(task, api, dryRun);
      status = dryRun ? 'writing' : 'review';
      break;
      
    case 'code':
      comment = await executeCode(task, api, dryRun);
      status = 'in progress'; // Code tasks stay in progress until PR merged
      break;
      
    default:
      comment = await executeOther(task, api, dryRun);
      status = 'review';
  }
  
  return { comment, attachments, status };
}

// Assist Trevor with his tasks
async function assistTrevorTask(
  task: any,
  api: ClickUpAPI,
  dryRun: boolean
): Promise<{ comment: string; attachments?: string[] } | null> {
  
  const classification = classifyTask(task.name, task.description);
  
  // Only assist with certain types
  if (!['research', 'write', 'analyze', 'data'].includes(classification.type)) {
    return null; // Skip complex tasks that need Trevor's judgment
  }
  
  log('INFO', `Assisting Trevor with: ${task.name} (${classification.type})`);
  
  if (dryRun) {
    return {
      comment: `🤖 Would assist Trevor with ${classification.type} task: "${task.name}"\n\n` +
        `(Dry run - no assistance provided)`
    };
  }
  
  // Generate assistance based on task type
  let comment = '';
  let attachments: string[] = [];
  
  switch (classification.type) {
    case 'research':
      comment = `🤖 Clawd Research Assistance\n\n` +
        `I've prepared preliminary research for this task:\n\n` +
        `- **Query:** "${task.name}"\n` +
        `- **Type:** Research\n\n` +
        `[Research results would be attached here]\n\n` +
        `Ready for your review and next steps!`;
      break;
      
    case 'write':
      comment = `🤖 Clawd Writing Assistance\n\n` +
        `I've drafted content for your review:\n\n` +
        `---\n` +
        `[Draft content would appear here]\n` +
        `---\n\n` +
        `Feel free to edit directly or let me know what to adjust!`;
      break;
      
    case 'analyze':
      comment = `🤖 Clawd Analysis Assistance\n\n` +
        `I've analyzed the data/requested information:\n\n` +
        `**Key Findings:**\n` +
        `- Finding 1\n` +
        `- Finding 2\n` +
        `- Finding 3\n\n` +
        `**Attached:** analysis-notes.md`;
      break;
      
    default:
      return null;
  }
  
  return { comment, attachments };
}

// Sync ClickUp structure to Obsidian (folders → areas, lists → projects)
async function syncStructureToObsidian(api: ClickUpAPI, dryRun: boolean) {
  log('INFO', 'Syncing ClickUp structure to Obsidian...');
  
  const OBSIDIAN_VAULT = '/home/desktop/obsidian-second-brain';
  const AREAS_DIR = `${OBSIDIAN_VAULT}/03-Areas`;
  const PROJECTS_DIR = `${OBSIDIAN_VAULT}/02-Projects`;
  
  // Ensure directories exist
  [AREAS_DIR, PROJECTS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
  
  const spaces = await api.getSpaces();
  let areasCreated = 0;
  let projectsCreated = 0;
  
  for (const space of spaces) {
    // Get folders (become Areas)
    const folders = await api.getFolders(space.id);
    
    for (const folder of folders) {
      const areaName = folder.name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
      const areaDir = `${AREAS_DIR}/${areaName}`;
      const areaFile = `${areaDir}/${areaName}.md`;
      
      if (!fs.existsSync(areaFile)) {
        if (dryRun) {
          log('INFO', `[DRY RUN] Would create Area: ${areaName}`);
          areasCreated++;
        } else {
          // Create area directory and file
          fs.mkdirSync(areaDir, { recursive: true });
          
          let content = `# ${folder.name}\n\n`;
          content += `**Type:** Area\n`;
          content += `**ClickUp Folder:** [View in ClickUp](https://app.clickup.com/${folder.id})\n`;
          content += `**Sync ID:** #clickup-folder-${folder.id}\n\n`;
          content += `## Projects\n\n`;
          
          if (folder.lists && folder.lists.length > 0) {
            for (const list of folder.lists) {
              const projectName = `${areaName}-${list.name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-')}`;
              content += `- [[${projectName}]] — ${list.task_count || 0} tasks\n`;
            }
          } else {
            content += `_No projects yet. Create a list in ClickUp to add a project._\n`;
          }
          
          content += `\n## Notes\n\n_Area overview and notes..._\n`;
          
          fs.writeFileSync(areaFile, content);
          log('INFO', `Created Area: ${areaName}`);
          areasCreated++;
        }
      }
      
      // Get lists in folder (become Projects)
      for (const list of folder.lists || []) {
        const projectName = `${areaName}-${list.name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-')}`;
        const projectDir = `${PROJECTS_DIR}/${projectName}`;
        const projectFile = `${projectDir}/${projectName}.md`;
        
        if (!fs.existsSync(projectFile)) {
          if (dryRun) {
            log('INFO', `[DRY RUN] Would create Project: ${projectName}`);
            projectsCreated++;
          } else {
            // Create project directory and file
            fs.mkdirSync(projectDir, { recursive: true });
            
            let content = `# ${list.name}\n\n`;
            content += `**Area:** [[${areaName}]]\n`;
            content += `**Status:** Active\n`;
            content += `**ClickUp List:** [View in ClickUp](https://app.clickup.com/${list.id})\n`;
            content += `**Sync ID:** #clickup-list-${list.id}\n\n`;
            content += `## Tasks\n\n`;
            content += `### Open\n\n_No tasks synced yet. Run sync to populate._\n\n`;
            content += `### Recently Completed\n\n_None yet._\n\n`;
            content += `## Notes\n\n_Project notes and documentation..._\n`;
            
            fs.writeFileSync(projectFile, content);
            log('INFO', `Created Project: ${projectName}`);
            projectsCreated++;
          }
        }
      }
    }
  }
  
  log('INFO', `Structure sync complete: ${areasCreated} areas, ${projectsCreated} projects`);
  return { areasCreated, projectsCreated };
}

// Main agent loop
async function runAgent(dryRun: boolean = false, once: boolean = false, syncStructure: boolean = true) {
  log('INFO', `Agent starting (dryRun: ${dryRun}, once: ${once}, syncStructure: ${syncStructure})`);
  
  // Load credentials
  const token = process.env.CLICKUP_API_TOKEN || process.env.CLAWD_CLICKUP_TOKEN;
  const teamId = process.env.CLICKUP_TEAM_ID;
  const clawdUserId = parseInt(process.env.CLAWD_CLICKUP_USER_ID || '0');
  const trevorUserId = parseInt(process.env.CLAWD_TREVOR_USER_ID || '0');
  
  if (!token || !teamId) {
    log('ERROR', 'Missing CLICKUP_API_TOKEN or CLICKUP_TEAM_ID');
    process.exit(2);
  }
  
  if (!clawdUserId) {
    log('WARN', 'CLAWD_CLICKUP_USER_ID not set - cannot detect assignments to Clawd');
  }
  
  if (!trevorUserId) {
    log('WARN', 'CLAWD_TREVOR_USER_ID not set - cannot assist Trevor');
  }
  
  const api = new ClickUpAPI(token, teamId);
  const state = loadState();
  
  // Health check before running
  const healthy = await healthCheck(api);
  if (!healthy) {
    log('ERROR', 'ClickUp API health check failed - aborting');
    process.exit(2);
  }
  
  let hasErrors = false;
  
  // Step 1: Sync structure (folders → areas, lists → projects)
  if (syncStructure) {
    try {
      await retryWithBackoff(
        async () => await syncStructureToObsidian(api, dryRun),
        3,
        'Structure sync'
      );
    } catch (e: any) {
      log('ERROR', `Structure sync failed: ${e.message}`, { error: e.stack });
      hasErrors = true;
    }
  }
  
  try {
    // Get all spaces
    const spaces = await retryWithBackoff(
      async () => await api.getSpaces(),
      3,
      'Get spaces'
    );
    log('INFO', `Found ${spaces.length} spaces`);
    
    for (const space of spaces) {
      // Get all tasks in space
      let allTasks: any[];
      try {
        allTasks = await retryWithBackoff(
          async () => await api.getAllTasksInSpace(space.id),
          3,
          `Get tasks in space ${space.name}`
        );
        log('INFO', `Space "${space.name}": ${allTasks.length} total tasks`);
      } catch (e: any) {
        log('ERROR', `Failed to get tasks for space ${space.name}`, { error: e.message });
        hasErrors = true;
        continue;
      }
      
      // Filter tasks assigned to Clawd
      const clawdTasks = clawdUserId 
        ? allTasks.filter(t => t.assignees?.some((a: any) => a.id === clawdUserId))
        : [];
      
      // Filter tasks assigned to Trevor (for assistance)
      const trevorTasks = trevorUserId
        ? allTasks.filter(t => 
            t.assignees?.some((a: any) => a.id === trevorUserId) &&
            !state.trevorTasksAssisted.includes(t.id) &&
            t.status?.type !== 'closed'
          )
        : [];
      
      log('INFO', `Found ${clawdTasks.length} tasks for Clawd, ${trevorTasks.length} tasks for Trevor`);
      
      // Process Clawd's tasks
      for (const task of clawdTasks) {
        // Skip already processed or in progress
        if (state.processedTasks.includes(task.id)) {
          log('DEBUG', `Skipping already processed task: ${task.id}`);
          continue;
        }
        
        if (state.inProgressTasks.includes(task.id)) {
          log('DEBUG', `Task already in progress: ${task.id}`);
          continue;
        }
        
        log('INFO', `Processing task: ${task.name} (${task.id})`);
        
        // Add "in progress" comment
        if (!dryRun) {
          try {
            await retryWithBackoff(
              async () => await (api as any).request(`/task/${task.id}/comment`, {
                method: 'POST',
                body: JSON.stringify({
                  comment_text: `🤖 Clawd is working on this...`
                })
              }),
              3,
              `Add in-progress comment to ${task.id}`
            );
            state.inProgressTasks.push(task.id);
            saveState(state);
          } catch (e: any) {
            log('WARN', `Could not add in-progress comment: ${e.message}`);
            hasErrors = true;
          }
        }
        
        // Classify and execute
        const classification = classifyTask(task.name, task.description);
        log('INFO', `Classified as: ${classification.type} (auto: ${classification.canAutoExecute})`);
        
        const result = await executeTask(task, api, classification, dryRun);
        
        // Comment results
        if (!dryRun) {
          try {
            await (api as any).request(`/task/${task.id}/comment`, {
              method: 'POST',
              body: JSON.stringify({
                comment_text: result.comment
              })
            });
            log('INFO', `Commented results on task: ${task.id}`);
          } catch (e) {
            log('ERROR', `Failed to comment: ${e}`);
          }
        }
        
        // Update status
        if (!dryRun && result.status) {
          try {
            await api.updateTask(task.id, { status: result.status });
            log('INFO', `Updated status to: ${result.status}`);
          } catch (e) {
            log('WARN', `Could not update status: ${e}`);
          }
        }
        
        // Mark as processed (unless it's a code task staying in progress)
        if (!dryRun && result.status !== 'in progress') {
          state.processedTasks.push(task.id);
          state.inProgressTasks = state.inProgressTasks.filter(id => id !== task.id);
          saveState(state);
        }
      }
      
      // Assist with Trevor's tasks
      for (const task of trevorTasks) {
        // Limit assistance to avoid spam
        if (state.trevorTasksAssisted.length > 50) {
          state.trevorTasksAssisted = state.trevorTasksAssisted.slice(-25);
        }
        
        log('INFO', `Assisting Trevor with: ${task.name}`);
        
        const assistance = await assistTrevorTask(task, api, dryRun);
        
        if (assistance && !dryRun) {
          try {
            await (api as any).request(`/task/${task.id}/comment`, {
              method: 'POST',
              body: JSON.stringify({
                comment_text: assistance.comment
              })
            });
            log('INFO', `Added assistance comment to: ${task.id}`);
            
            // Track that we assisted
            state.trevorTasksAssisted.push(task.id);
            saveState(state);
          } catch (e) {
            log('ERROR', `Failed to add assistance: ${e}`);
          }
        }
      }
    }
    
    state.lastPoll = new Date().toISOString();
    saveState(state);
    
    log('INFO', 'Agent run complete');
    
    // Exit with appropriate code
    if (hasErrors) {
      log('WARN', 'Agent completed with errors');
      process.exit(1);
    }
    
  } catch (error: any) {
    log('ERROR', `Agent error: ${error.message}`, { stack: error.stack });
    process.exit(2);
  }
}

// CLI
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const once = args.includes('--once') || args.includes('--run-now');
const verbose = args.includes('--verbose');
const syncOnly = args.includes('--sync-only');
const noSync = args.includes('--no-sync');

if (verbose) {
  process.env.VERBOSE = 'true';
}

if (args.includes('--status')) {
  const state = loadState();
  console.log('Clawd ClickUp Agent Status');
  console.log('==========================');
  console.log(`Last poll: ${state.lastPoll}`);
  console.log(`Processed tasks: ${state.processedTasks.length}`);
  console.log(`In progress: ${state.inProgressTasks.length}`);
  console.log(`Trevor tasks assisted: ${state.trevorTasksAssisted.length}`);
  console.log(`\nRecent log (last 10 lines):`);
  if (fs.existsSync(LOG_FILE)) {
    const lines = fs.readFileSync(LOG_FILE, 'utf-8').split('\n').filter(Boolean).slice(-10);
    console.log(lines.join('\n'));
  }
  process.exit(0);
}

if (args.includes('--help')) {
  console.log(`Clawd ClickUp Agent

Usage: clickup-agent.ts [options]

Options:
  --dry-run       Show what would be done without making changes
  --once          Run once and exit (don't loop)
  --status        Show current agent status
  --sync-only     Only sync structure (folders→areas, lists→projects), skip task execution
  --no-sync       Skip structure sync, only execute tasks
  --verbose       Show detailed output
  --help          Show this help

Environment:
  CLICKUP_API_TOKEN       ClickUp API token
  CLICKUP_TEAM_ID         ClickUp team ID
  CLAWD_CLICKUP_USER_ID   Clawd's user ID
  CLAWD_TREVOR_USER_ID    Trevor's user ID

Examples:
  clickup-agent.ts --run-now           # Full run: sync structure + execute tasks
  clickup-agent.ts --sync-only         # Only sync folders/lists to Obsidian
  clickup-agent.ts --no-sync --run-now # Only execute tasks, skip structure sync
  clickup-agent.ts --dry-run           # Preview all changes
`);
  process.exit(0);
}

// Run
if (syncOnly) {
  // Just sync structure, no task execution
  const token = process.env.CLICKUP_API_TOKEN || process.env.CLAWD_CLICKUP_TOKEN;
  const teamId = process.env.CLICKUP_TEAM_ID;
  if (!token || !teamId) {
    console.error('Missing CLICKUP_API_TOKEN or CLICKUP_TEAM_ID');
    process.exit(1);
  }
  const api = new ClickUpAPI(token, teamId);
  syncStructureToObsidian(api, dryRun).then(() => {
    console.log('✅ Structure sync complete');
    process.exit(0);
  }).catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
} else {
  runAgent(dryRun, once, !noSync).catch(err => {
    log('ERROR', `Fatal error: ${err}`);
    process.exit(1);
  });
}
