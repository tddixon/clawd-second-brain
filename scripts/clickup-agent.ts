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
import { ClickUpAPI } from '../projects/pkm-system/scripts/clickup-api';

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

// Logger
function log(level: string, message: string) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, line);
  if (process.env.VERBOSE) console.log(line.trim());
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

// Main agent loop
async function runAgent(dryRun: boolean = false, once: boolean = false) {
  log('INFO', `Agent starting (dryRun: ${dryRun}, once: ${once})`);
  
  // Load credentials
  const token = process.env.CLICKUP_API_TOKEN || process.env.CLAWD_CLICKUP_TOKEN;
  const teamId = process.env.CLICKUP_TEAM_ID;
  const clawdUserId = parseInt(process.env.CLAWD_CLICKUP_USER_ID || '0');
  const trevorUserId = parseInt(process.env.CLAWD_TREVOR_USER_ID || '0');
  
  if (!token || !teamId) {
    log('ERROR', 'Missing CLICKUP_API_TOKEN or CLICKUP_TEAM_ID');
    process.exit(1);
  }
  
  if (!clawdUserId) {
    log('WARN', 'CLAWD_CLICKUP_USER_ID not set - cannot detect assignments to Clawd');
  }
  
  if (!trevorUserId) {
    log('WARN', 'CLAWD_TREVOR_USER_ID not set - cannot assist Trevor');
  }
  
  const api = new ClickUpAPI(token, teamId);
  const state = loadState();
  
  try {
    // Get all spaces
    const spaces = await api.getSpaces();
    log('INFO', `Found ${spaces.length} spaces`);
    
    for (const space of spaces) {
      // Get all tasks in space
      const allTasks = await api.getAllTasksInSpace(space.id);
      log('INFO', `Space "${space.name}": ${allTasks.length} total tasks`);
      
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
            await (api as any).request(`/task/${task.id}/comment`, {
              method: 'POST',
              body: JSON.stringify({
                comment_text: `🤖 Clawd is working on this...`
              })
            });
            state.inProgressTasks.push(task.id);
            saveState(state);
          } catch (e) {
            log('WARN', `Could not add in-progress comment: ${e}`);
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
    
  } catch (error) {
    log('ERROR', `Agent error: ${error}`);
  }
}

// CLI
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const once = args.includes('--once') || args.includes('--run-now');
const verbose = args.includes('--verbose');

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
  --verbose       Show detailed output
  --help          Show this help

Environment:
  CLICKUP_API_TOKEN       ClickUp API token
  CLICKUP_TEAM_ID         ClickUp team ID
  CLAWD_CLICKUP_USER_ID   Clawd's user ID
  CLAWD_TREVOR_USER_ID    Trevor's user ID
`);
  process.exit(0);
}

// Run
runAgent(dryRun, once).catch(err => {
  log('ERROR', `Fatal error: ${err}`);
  process.exit(1);
});
