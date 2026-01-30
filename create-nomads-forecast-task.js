/**
 * Create ClickUp task + Obsidian task for Nomads profitability forecast
 * Standalone version using fetch directly
 */

const https = require('https');
const http = require('http');
const { readFileSync, writeFileSync } = require('fs');
const { resolve } = require('path');

const CLICKUP_API_TOKEN = process.env.CLICKUP_API_TOKEN;
const CLICKUP_TEAM_ID = process.env.CLICKUP_TEAM_ID;
const OBSIDIAN_VAULT = process.env.OBSIDIAN_VAULT || '/home/desktop/obsidian-vault';

const CLICKUP_BASE_URL = "https://api.clickup.com/api/v2";

// Helper function to make ClickUp API requests
async function clickUpRequest(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${CLICKUP_BASE_URL}${endpoint}`);

    const requestOptions = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Authorization': CLICKUP_API_TOKEN,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        } else {
          reject(new Error(`ClickUp API error: ${res.statusCode} ${data}`));
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Get spaces
async function getSpaces() {
  const result = await clickUpRequest(`/team/${CLICKUP_TEAM_ID}/space`);
  return result.spaces;
}

// Get folders
async function getFolders(spaceId) {
  const result = await clickUpRequest(`/space/${spaceId}/folder`);
  return result.folders;
}

// Create task
async function createTask(listId, params) {
  return clickUpRequest(`/list/${listId}/task`, {
    method: 'POST',
    body: params
  });
}

// Update task
async function updateTask(taskId, params) {
  return clickUpRequest(`/task/${taskId}`, {
    method: 'PUT',
    body: params
  });
}

// Task details
const taskName = "Self-management profitability forecast - hostel acquisitions";
const taskDescription = `Build spreadsheet showing revenue projections comparing:
- (A) Self-managed model with 10% margin
- (B) Current franchise model

Given 2.3M THB renovation spend upfront.

**Notes to verify:**
- Current situation: Multi-hostel operation under franchise model
- Renovation spend: 2.3M THB (assumption - please verify)
- Margin assumption: 10% for self-managed (please confirm)
- Strategic questions to answer:
  - Acquisition budget?
  - Hostel count for projection?

**Spreadsheet scenarios:**
- Scenario A: All self-managed (10% margin)
- Scenario B: Mix of self-managed + franchise
- Timeline: 3-5 years projection

**Metrics to track:**
- RevPAR (revenue per available room)
- RevPAC (revenue per available room)
- Occupancy
- Marketing costs
- Staffing

**Questions for Trevor:**
1. What's the deadline for this analysis?
2. What is the current hostel count?
3. What's the acquisition budget?
4. Any additional assumptions or constraints?`;

async function createTask() {
  console.log('🔍 Finding Nomads Current folder...');

  // Get Nomads space
  const spaces = await getSpaces();
  const nomadsSpace = spaces.find(s => s.name === 'Nomads');

  if (!nomadsSpace) {
    console.error('❌ Nomads space not found');
    process.exit(1);
  }

  console.log(`✅ Found Nomads space: ${nomadsSpace.id}`);

  // Get folders
  const folders = await getFolders(nomadsSpace.id);
  const currentFolder = folders.find(f => f.name === 'Current');

  if (!currentFolder) {
    console.error('❌ Current folder not found');
    process.exit(1);
  }

  console.log(`✅ Found Current folder: ${currentFolder.id}`);

  // Find the appropriate list - for strategic business decisions
  // Let's use the first list in Current folder or a general one
  const targetList = currentFolder.lists.find(l =>
    l.name.toLowerCase().includes('operations') ||
    l.name.toLowerCase().includes('general') ||
    l.name.toLowerCase().includes('strategy')
  ) || currentFolder.lists[0]; // Fallback to first list

  console.log(`✅ Using list: ${targetList.name} (${targetList.id})`);

  // Create ClickUp task
  console.log('\n📝 Creating ClickUp task...');

  const clickUpTask = await createTask(targetList.id, {
    name: taskName,
    description: taskDescription,
    priority: 2, // High priority
    tags: ['finance', 'strategy', 'business-model', 'nomads']
  });

  console.log(`✅ ClickUp task created: ${clickUpTask.id}`);
  console.log(`   URL: ${clickUpTask.url}`);

  // Create Obsidian task
  console.log('\n📝 Creating Obsidian task...');

  const currentDate = new Date().toISOString().split('T')[0];
  const cuId = `[CU-${clickUpTask.id}]`;
  const obsidianTask = `- [ ] ${taskName} 🔺 ${cuId} #finance #business-model #strategy #nomads
  📍 [[1-Projects/Nomads/Active|Nomads Active]]
  **Created:** ${currentDate}
  **Priority:** High
  **Status:** Questions to answer

  ---
  **Notes:**
  ${taskDescription.split('\n').map(line => `  ${line}`).join('\n')}

  **Questions for Trevor:**
  1. What's the deadline for this analysis?
  2. What is the current hostel count?
  3. What's the acquisition budget?
  4. Any additional assumptions or constraints?

  ---
  **ClickUp:** ${clickUpTask.url}`;

  // Find the Obsidian file for Nomads Active
  const obsidianProjectPath = resolve(OBSIDIAN_VAULT, '1-Projects', 'Nomads', 'Active', '_summary.md');

  try {
    // Read existing file
    let existingContent = '';
    try {
      existingContent = readFileSync(obsidianProjectPath, 'utf-8');
    } catch (e) {
      // File doesn't exist, create header
      existingContent = `# Nomads Active - Summary

> Last updated: ${currentDate}

## 🔴 High Priority / Critical
`;
    }

    // Add task to High Priority section
    const highPrioritySection = '## 🔴 High Priority / Critical';
    const sectionIndex = existingContent.indexOf(highPrioritySection);

    if (sectionIndex !== -1) {
      // Insert after the section header
      const beforeSection = existingContent.slice(0, sectionIndex + highPrioritySection.length);
      const afterSection = existingContent.slice(sectionIndex + highPrioritySection.length);

      const updatedContent = beforeSection + '\n' + obsidianTask + afterSection;
      writeFileSync(obsidianProjectPath, updatedContent);
    } else {
      // Section doesn't exist, append at beginning
      const newSection = `${highPrioritySection}\n${obsidianTask}\n\n`;
      writeFileSync(obsidianProjectPath, newSection + existingContent);
    }

    console.log(`✅ Obsidian task created: ${obsidianProjectPath}`);
  } catch (e) {
    console.error('❌ Error creating Obsidian task:', e);
    console.log('   Manual Obsidian entry:');
    console.log(obsidianTask);
  }

  // Update ClickUp task with Obsidian link
  console.log('\n📝 Updating ClickUp task with Obsidian link...');

  await updateTask(clickUpTask.id, {
    description: `${taskDescription}\n\n**Obsidian Link:** [[1-Projects/Nomads/Active/_summary.md]]`
  });

  console.log('✅ ClickUp task updated with Obsidian link');

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('✅ TASKS CREATED SUCCESSFULLY');
  console.log('='.repeat(60));
  console.log('\n**Task:** Self-management profitability forecast - hostel acquisitions');
  console.log(`**ClickUp ID:** CU-${clickUpTask.id}`);
  console.log(`**ClickUp URL:** ${clickUpTask.url}`);
  console.log(`**Obsidian Location:** [[1-Projects/Nomads/Active/_summary.md]]`);
  console.log('\n**Status:** Questions to answer from Trevor:');
  console.log('1. Deadline for analysis?');
  console.log('2. Current hostel count?');
  console.log('3. Acquisition budget?');
  console.log('4. Additional assumptions?');
  console.log('\n' + '='.repeat(60));
}

createTask().catch(console.error);
