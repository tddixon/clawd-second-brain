import { ClickUpAPI } from './projects/pkm-system/scripts/clickup-api.ts';

const token = process.env.CLICKUP_API_TOKEN!;
const teamId = process.env.CLICKUP_TEAM_ID!;

const api = new ClickUpAPI(token, teamId);

async function discover() {
  console.log('🔍 Discovering ClickUp structure...\n');
  
  // Get spaces
  const spaces = await api.getSpaces();
  
  for (const space of spaces) {
    console.log(`📦 Space: ${space.name}`);
    
    // Get folders in this space
    const folders = await api.getFolders(space.id);
    
    for (const folder of folders) {
      console.log(`  📁 Folder: ${folder.name} (ID: ${folder.id})`);
      
      // Get lists in this folder
      for (const list of folder.lists) {
        console.log(`    📋 List: ${list.name} (ID: ${list.id}) - ${list.task_count} tasks`);
      }
    }
    
    // Get folderless lists
    const folderlessLists = await api.getFolderlessLists(space.id);
    if (folderlessLists.length > 0) {
      console.log(`  📂 Folderless Lists:`);
      for (const list of folderlessLists) {
        console.log(`    📋 ${list.name} (ID: ${list.id}) - ${list.task_count} tasks`);
      }
    }
  }
}

discover().catch(console.error);
