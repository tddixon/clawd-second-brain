#!/usr/bin/env node

const CLICKUP_BASE_URL = "https://api.clickup.com/api/v2";

async function request(endpoint) {
  const response = await fetch(`${CLICKUP_BASE_URL}${endpoint}`, {
    headers: {
      Authorization: process.env.CLICKUP_API_TOKEN,
      "Content-Type": "application/json",
    },
  });
  
  if (!response.ok) {
    throw new Error(`ClickUp API error: ${response.statusText}`);
  }
  
  return await response.json();
}

async function discover() {
  console.log('🔍 Discovering ClickUp structure...\n');
  
  const teamId = process.env.CLICKUP_TEAM_ID;
  
  // Get spaces
  const { spaces } = await request(`/team/${teamId}/space?archived=false`);
  
  for (const space of spaces) {
    console.log(`📦 Space: ${space.name}`);
    
    // Get folders in this space
    const { folders } = await request(`/space/${space.id}/folder?archived=false`);
    
    for (const folder of folders) {
      console.log(`  📁 Folder: ${folder.name} (ID: ${folder.id})`);
      
      // Get lists in this folder
      const { lists } = await request(`/folder/${folder.id}/list?archived=false`);
      
      for (const list of lists) {
        console.log(`    📋 List: ${list.name} (ID: ${list.id}) - ${list.task_count || 0} tasks`);
      }
    }
    
    // Get folderless lists
    const { lists: folderlessLists } = await request(`/space/${space.id}/list?archived=false`);
    if (folderlessLists.length > 0) {
      console.log(`  📂 Folderless Lists:`);
      for (const list of folderlessLists) {
        console.log(`    📋 ${list.name} (ID: ${list.id}) - ${list.task_count || 0} tasks`);
      }
    }
    
    console.log('');
  }
}

discover().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
