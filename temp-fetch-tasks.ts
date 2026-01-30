import { ClickUpAPI } from "./projects/pkm-system/scripts/clickup-api.ts";

const token = process.env.CLICKUP_API_TOKEN;
const teamId = process.env.CLICKUP_TEAM_ID;

if (!token || !teamId) {
  console.error("CLICKUP_API_TOKEN and CLICKUP_TEAM_ID required");
  process.exit(1);
}

const api = new ClickUpAPI(token, teamId);

// Get all active tasks from Nomads space
async function main() {
  const nomadsSpaceId = "90171123690";
  const tasks = await api.getAllTasksInSpace(nomadsSpaceId);

  // Filter: not closed/completed
  const activeTasks = tasks.filter(t => !t.date_closed);

  // Group by status
  const byStatus: Record<string, any[]> = {};
  const byPriority: Record<string, any[]> = {};
  const byList: Record<string, any[]> = {};
  const overdue: any[] = [];
  const dueTomorrow: any[] = [];
  const dueThisWeek: any[] = [];

  const now = new Date();
  const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
  const tomorrowEnd = tomorrowStart + 24 * 60 * 60 * 1000;
  const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).getTime();

  activeTasks.forEach(task => {
    // By status
    const status = task.status.status;
    byStatus[status] = byStatus[status] || [];
    byStatus[status].push(task);

    // By priority
    const priority = task.priority?.priority || "none";
    byPriority[priority] = byPriority[priority] || [];
    byPriority[priority].push(task);

    // By list
    const listName = task.list.name;
    byList[listName] = byList[listName] || [];
    byList[listName].push(task);

    // By due date
    if (task.due_date) {
      const dueDate = parseInt(task.due_date);
      if (dueDate < tomorrowStart) {
        overdue.push(task);
      } else if (dueDate >= tomorrowStart && dueDate < tomorrowEnd) {
        dueTomorrow.push(task);
      } else if (dueDate >= tomorrowStart && dueDate < weekEnd) {
        dueThisWeek.push(task);
      }
    }
  });

  console.log(JSON.stringify({
    total: activeTasks.length,
    byStatus: Object.fromEntries(Object.entries(byStatus).map(([k, v]) => [k, v.length])),
    byPriority: Object.fromEntries(Object.entries(byPriority).map(([k, v]) => [k, v.length])),
    byList: Object.fromEntries(Object.entries(byList).map(([k, v]) => [k, v.length])),
    tasks: activeTasks.map(t => ({
      id: t.id,
      name: t.name,
      status: t.status.status,
      priority: t.priority?.priority || null,
      due_date: t.due_date ? new Date(parseInt(t.due_date)).toISOString() : null,
      list: t.list.name,
      folder: t.folder.name,
      space: { id: t.space.id },
      url: t.url,
      assignees: t.assignees.map(a => a.username)
    })),
    overdue: overdue.map(t => t.id),
    dueTomorrow: dueTomorrow.map(t => t.id),
    dueThisWeek: dueThisWeek.map(t => t.id)
  }, null, 2));
}

main().catch(console.error);
