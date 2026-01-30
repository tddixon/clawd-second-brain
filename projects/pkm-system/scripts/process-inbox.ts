#!/usr/bin/env node

import ClickUpAPI from './clickup-api.ts';
import * as fs from 'fs';
import * as path from 'path';

const INBOX_LIST_ID = '901704842772';
const OBSIDIAN_VAULT = '/home/desktop/obsidian-vault';

// Mapping of ClickUp List IDs to Obsidian project paths
const LIST_TO_PROJECT: Record<string, string> = {
  // Nomads Space - Active
  '901706575330': '1-Projects/Nomads/Active/Marketing',
  '901706575317': '1-Projects/Nomads/Active/Nomads-Bangkok',
  '901706675677': '1-Projects/Nomads/Active/Wristband-POS',
  '901706575383': '1-Projects/Nomads/Active/Nomads-Asia-Website',
  '901707394124': '1-Projects/Nomads/Active/Month-End-Accounting',
  '901707569846': '1-Projects/Nomads/Active/Graphic-Design',
  
  // Nomads Space - On-Hold
  '901705020429': '1-Projects/Nomads/On-Hold/Accounting',
  '901704911466': '1-Projects/Nomads/On-Hold/Koh-Tao',
  '901704869963': '1-Projects/Nomads/On-Hold/Bangkok-Deal',
  '901704864335': '1-Projects/Nomads/On-Hold/Social-Media',
  
  // Nomads Space - Operations
  '901708952927': '1-Projects/Nomads/Operations/Ops-Dashboard',
  '901708962902': '1-Projects/Nomads/Operations/Noho-Ops-Dashboard',
  '901710032091': '1-Projects/Nomads/Operations/Accounting',
  
  // Personal
  '900303131124': '1-Projects/Personal/General',
  
  // Bamboo
  '901704835494': '1-Projects/Bamboo/Bamboo-General',
};

interface ProcessingResult {
  taskId: string;
  taskName: string;
  customId: string | null;
  destinationList: string;
  destinationProject: string;
  status: 'processed' | 'needs_clarification' | 'error';
  error?: string;
}

function getPriorityEmoji(priority: { id: string; priority: string } | null): string {
  if (!priority) return '🔼'; // Normal
  switch (priority.priority.toLowerCase()) {
    case 'urgent':
    case 'high':
      return '🔺';
    case 'normal':
      return '🔼';
    case 'low':
      return '🔽';
    default:
      return '🔼';
  }
}

function inferContextTag(taskName: string, description: string): string {
  const text = (taskName + ' ' + description).toLowerCase();
  
  if (text.match(/\b(email|call|phone|message|whatsapp)\b/)) return '#context/phone';
  if (text.match(/\b(design|code|write|spreadsheet|document)\b/)) return '#context/computer';
  if (text.match(/\b(meeting|office|staff|team)\b/)) return '#context/office';
  if (text.match(/\b(buy|purchase|pickup|deliver)\b/)) return '#context/errands';
  
  return '#context/computer'; // Default
}

function inferEnergyTag(taskName: string, priority: { id: string; priority: string } | null): string {
  const text = taskName.toLowerCase();
  
  // High energy for complex/creative work
  if (text.match(/\b(design|strategy|plan|create|develop)\b/)) return '#energy/high';
  
  // Low energy for simple/routine work
  if (text.match(/\b(check|review|update|send|forward)\b/)) return '#energy/low';
  
  // Default based on priority
  if (priority?.priority.toLowerCase() === 'urgent') return '#energy/high';
  if (priority?.priority.toLowerCase() === 'high') return '#energy/medium';
  
  return '#energy/medium'; // Default
}

function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return '';
  const date = new Date(parseInt(dueDate));
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return ` 📅 ${year}-${month}-${day}`;
}

function createObsidianTask(
  task: any,
  projectPath: string,
  priorityEmoji: string
): string {
  const dueDate = formatDueDate(task.due_date);
  const contextTag = inferContextTag(task.name, task.description || '');
  const energyTag = inferEnergyTag(task.name, task.priority);
  const customId = task.custom_id || task.id;
  
  return `- [ ] ${task.name} ${priorityEmoji}${dueDate} [CU-${customId}](${task.url}) ${contextTag} ${energyTag}`;
}

function getSectionForPriority(priority: { id: string; priority: string } | null): string {
  if (!priority) return 'Next Actions';
  switch (priority.priority.toLowerCase()) {
    case 'urgent':
    case 'high':
      return 'High Priority';
    case 'normal':
      return 'Next Actions';
    case 'low':
      return 'Someday/Maybe';
    default:
      return 'Next Actions';
  }
}

async function addTaskToObsidian(
  task: any,
  projectPath: string
): Promise<void> {
  const fullPath = path.join(OBSIDIAN_VAULT, projectPath);
  const tasksFile = path.join(fullPath, 'tasks.md');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
  
  const priorityEmoji = getPriorityEmoji(task.priority);
  const section = getSectionForPriority(task.priority);
  const taskLine = createObsidianTask(task, projectPath, priorityEmoji);
  
  // Read or create tasks file
  let content = '';
  if (fs.existsSync(tasksFile)) {
    content = fs.readFileSync(tasksFile, 'utf-8');
  } else {
    content = `# Tasks\n\n## High Priority\n\n## Next Actions\n\n## Someday/Maybe\n\n`;
  }
  
  // Find the section and add the task
  const sectionHeader = `## ${section}`;
  const sectionIndex = content.indexOf(sectionHeader);
  
  if (sectionIndex === -1) {
    // Section doesn't exist, add it
    content += `\n${sectionHeader}\n\n${taskLine}\n`;
  } else {
    // Find the next section or end of file
    const nextSectionIndex = content.indexOf('\n## ', sectionIndex + sectionHeader.length);
    const insertPosition = nextSectionIndex === -1 
      ? content.length 
      : nextSectionIndex;
    
    // Insert task before next section
    const beforeSection = content.substring(0, insertPosition);
    const afterSection = content.substring(insertPosition);
    content = beforeSection.trimEnd() + '\n' + taskLine + '\n' + afterSection;
  }
  
  fs.writeFileSync(tasksFile, content, 'utf-8');
}

async function inferDestinationList(task: any): Promise<string | null> {
  const name = task.name.toLowerCase();
  const desc = (task.description || '').toLowerCase();
  const text = name + ' ' + desc;
  
  // Marketing keywords
  if (text.match(/\b(marketing|campaign|social media|instagram|facebook|ad|promotion)\b/)) {
    return '901706575330'; // Marketing
  }
  
  // Nomads Bangkok keywords
  if (text.match(/\b(nomads bangkok|bangkok|noho)\b/)) {
    return '901706575317'; // Nomads Bangkok
  }
  
  // Wristband POS keywords
  if (text.match(/\b(wristband|pos|payment|rfid)\b/)) {
    return '901706675677'; // Wristband POS
  }
  
  // Website keywords
  if (text.match(/\b(website|web|domain|hosting|seo)\b/)) {
    return '901706575383'; // Nomads Asia Website
  }
  
  // Accounting keywords
  if (text.match(/\b(accounting|invoice|tax|bookkeeping|month end)\b/)) {
    return '901707394124'; // Month End Accounting
  }
  
  // Design keywords
  if (text.match(/\b(design|graphic|logo|flyer|poster|artwork)\b/)) {
    return '901707569846'; // Graphic Design
  }
  
  // Koh Tao keywords
  if (text.match(/\b(koh tao|koh\s*tao|island)\b/)) {
    return '901704911466'; // Koh Tao
  }
  
  // Operations keywords
  if (text.match(/\b(operations|ops|dashboard|inventory|supplies)\b/)) {
    return '901708952927'; // Ops Dashboard
  }
  
  // Bamboo keywords
  if (text.match(/\b(bamboo|sushi|take sushi)\b/)) {
    return '901704835494'; // Bamboo General
  }
  
  // Personal keywords
  if (text.match(/\b(personal|private|self)\b/)) {
    return '900303131124'; // Personal General
  }
  
  return null; // Needs clarification
}

async function main() {
  const token = process.env.CLICKUP_API_TOKEN;
  const teamId = process.env.CLICKUP_TEAM_ID;
  
  if (!token || !teamId) {
    console.error('CLICKUP_API_TOKEN and CLICKUP_TEAM_ID required');
    process.exit(1);
  }
  
  const api = new ClickUpAPI(token, teamId);
  const results: ProcessingResult[] = [];
  const needsClarification: any[] = [];
  
  console.log('📥 Fetching inbox tasks...\n');
  
  const tasks = await api.getTasks(INBOX_LIST_ID, { include_closed: false });
  
  console.log(`Found ${tasks.length} tasks in inbox\n`);
  
  for (const task of tasks) {
    console.log(`Processing: ${task.name}`);
    
    try {
      // Infer destination list
      const destinationListId = await inferDestinationList(task);
      
      if (!destinationListId) {
        console.log(`  ⚠️  Needs clarification\n`);
        needsClarification.push(task);
        results.push({
          taskId: task.id,
          taskName: task.name,
          customId: task.custom_id,
          destinationList: 'unknown',
          destinationProject: 'unknown',
          status: 'needs_clarification',
        });
        continue;
      }
      
      const destinationProject = LIST_TO_PROJECT[destinationListId];
      
      if (!destinationProject) {
        console.log(`  ⚠️  Unknown list ID: ${destinationListId}\n`);
        needsClarification.push(task);
        results.push({
          taskId: task.id,
          taskName: task.name,
          customId: task.custom_id,
          destinationList: destinationListId,
          destinationProject: 'unknown',
          status: 'needs_clarification',
        });
        continue;
      }
      
      // Add to Obsidian
      await addTaskToObsidian(task, destinationProject);
      console.log(`  ✅ Added to Obsidian: ${destinationProject}`);
      
      // Move in ClickUp (don't delete or complete)
      await api.updateTask(task.id, {
        // Move to new list by updating the task's list
        // Note: This requires using the move endpoint
      });
      
      // ClickUp doesn't support moving via updateTask, need to use a different approach
      // For now, we'll just track the intended destination
      
      console.log(`  📦 Should move to list: ${destinationListId}\n`);
      
      results.push({
        taskId: task.id,
        taskName: task.name,
        customId: task.custom_id,
        destinationList: destinationListId,
        destinationProject,
        status: 'processed',
      });
      
    } catch (error) {
      console.log(`  ❌ Error: ${error}\n`);
      results.push({
        taskId: task.id,
        taskName: task.name,
        customId: task.custom_id,
        destinationList: 'error',
        destinationProject: 'error',
        status: 'error',
        error: String(error),
      });
    }
  }
  
  // Generate report
  console.log('\n' + '='.repeat(60));
  console.log('## ✅ Inbox Processing Report\n');
  console.log(`**Tasks Processed:** ${results.filter(r => r.status === 'processed').length}/${tasks.length}\n`);
  
  // Count by destination
  const byProject: Record<string, number> = {};
  results.filter(r => r.status === 'processed').forEach(r => {
    byProject[r.destinationProject] = (byProject[r.destinationProject] || 0) + 1;
  });
  
  console.log('**Routed:**');
  Object.entries(byProject).sort((a, b) => b[1] - a[1]).forEach(([proj, count]) => {
    console.log(`- ${proj}: ${count} tasks`);
  });
  
  if (needsClarification.length > 0) {
    console.log(`\n**⚠️  Needs Clarification:** ${needsClarification.length} tasks\n`);
    needsClarification.forEach(task => {
      console.log(`- [${task.custom_id || task.id}] ${task.name}`);
      if (task.description) {
        console.log(`  Description: ${task.description.substring(0, 100)}...`);
      }
    });
  }
  
  const errors = results.filter(r => r.status === 'error');
  if (errors.length > 0) {
    console.log(`\n**❌ Errors:** ${errors.length} tasks\n`);
    errors.forEach(r => {
      console.log(`- ${r.taskName}: ${r.error}`);
    });
  }
  
  console.log('\n**Summary:**');
  console.log('Obsidian tasks created with [CU-ID] links.');
  console.log('⚠️  Note: ClickUp API does not support moving tasks between lists via simple update.');
  console.log('Tasks remain in inbox. Manual move or custom API call needed.');
  
  // Save results to file
  fs.writeFileSync(
    '/home/desktop/clawd/projects/pkm-system/inbox-processing-results.json',
    JSON.stringify(results, null, 2)
  );
  
  console.log('\n📄 Full results saved to: inbox-processing-results.json');
}

main().catch(console.error);
