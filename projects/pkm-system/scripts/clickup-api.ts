/**
 * ClickUp API Integration
 * https://clickup.com/api/
 */

const CLICKUP_BASE_URL = "https://api.clickup.com/api/v2";

interface ClickUpTask {
  id: string;
  custom_id: string | null;
  name: string;
  text_content: string;
  description: string;
  status: {
    status: string;
    color: string;
    type: string;
  };
  orderindex: string;
  date_created: string;
  date_updated: string;
  date_closed: string | null;
  creator: { id: number; username: string; email: string };
  assignees: Array<{ id: number; username: string; email: string }>;
  priority: { id: string; priority: string; color: string } | null;
  due_date: string | null;
  start_date: string | null;
  time_estimate: number | null;
  time_spent: number | null;
  list: { id: string; name: string };
  folder: { id: string; name: string };
  space: { id: string };
  url: string;
  tags: Array<{ name: string; tag_fg: string; tag_bg: string }>;
}

interface ClickUpList {
  id: string;
  name: string;
  orderindex: number;
  status: { status: string; color: string };
  priority: { priority: string; color: string } | null;
  assignee: { id: number; username: string } | null;
  task_count: number;
  due_date: string | null;
  folder: { id: string; name: string };
  space: { id: string; name: string };
}

interface ClickUpSpace {
  id: string;
  name: string;
  private: boolean;
  statuses: Array<{ status: string; type: string; color: string }>;
  features: Record<string, { enabled: boolean }>;
}

interface ClickUpFolder {
  id: string;
  name: string;
  orderindex: number;
  space: { id: string; name: string };
  lists: ClickUpList[];
}

interface CreateTaskParams {
  name: string;
  description?: string;
  assignees?: number[];
  status?: string;
  priority?: number; // 1=Urgent, 2=High, 3=Normal, 4=Low
  due_date?: number; // Unix timestamp in ms
  due_date_time?: boolean;
  start_date?: number;
  notify_all?: boolean;
  tags?: string[];
}

export class ClickUpAPI {
  private token: string;
  private teamId: string;

  constructor(token: string, teamId: string) {
    this.token = token;
    this.teamId = teamId;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${CLICKUP_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        Authorization: this.token,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`ClickUp API error: ${response.status} ${text}`);
    }

    return response.json();
  }

  // ===== SPACES =====

  async getSpaces(): Promise<ClickUpSpace[]> {
    const result = await this.request<{ spaces: ClickUpSpace[] }>(
      `/team/${this.teamId}/space`
    );
    return result.spaces;
  }

  async getSpace(spaceId: string): Promise<ClickUpSpace> {
    return this.request<ClickUpSpace>(`/space/${spaceId}`);
  }

  // ===== FOLDERS =====

  async getFolders(spaceId: string): Promise<ClickUpFolder[]> {
    const result = await this.request<{ folders: ClickUpFolder[] }>(
      `/space/${spaceId}/folder`
    );
    return result.folders;
  }

  // ===== LISTS =====

  async getLists(folderId: string): Promise<ClickUpList[]> {
    const result = await this.request<{ lists: ClickUpList[] }>(
      `/folder/${folderId}/list`
    );
    return result.lists;
  }

  async getFolderlessLists(spaceId: string): Promise<ClickUpList[]> {
    const result = await this.request<{ lists: ClickUpList[] }>(
      `/space/${spaceId}/list`
    );
    return result.lists;
  }

  // ===== TASKS =====

  async getTasks(
    listId: string,
    options?: {
      archived?: boolean;
      include_closed?: boolean;
      subtasks?: boolean;
      statuses?: string[];
      assignees?: number[];
      due_date_gt?: number;
      due_date_lt?: number;
    }
  ): Promise<ClickUpTask[]> {
    const params = new URLSearchParams();
    if (options?.archived !== undefined)
      params.append("archived", String(options.archived));
    if (options?.include_closed !== undefined)
      params.append("include_closed", String(options.include_closed));
    if (options?.subtasks !== undefined)
      params.append("subtasks", String(options.subtasks));
    if (options?.statuses)
      options.statuses.forEach((s) => params.append("statuses[]", s));
    if (options?.assignees)
      options.assignees.forEach((a) => params.append("assignees[]", String(a)));
    if (options?.due_date_gt)
      params.append("due_date_gt", String(options.due_date_gt));
    if (options?.due_date_lt)
      params.append("due_date_lt", String(options.due_date_lt));

    const query = params.toString();
    const result = await this.request<{ tasks: ClickUpTask[] }>(
      `/list/${listId}/task${query ? `?${query}` : ""}`
    );
    return result.tasks;
  }

  async getTask(taskId: string): Promise<ClickUpTask> {
    return this.request<ClickUpTask>(`/task/${taskId}`);
  }

  async createTask(listId: string, params: CreateTaskParams): Promise<ClickUpTask> {
    return this.request<ClickUpTask>(`/list/${listId}/task`, {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async updateTask(
    taskId: string,
    params: Partial<CreateTaskParams>
  ): Promise<ClickUpTask> {
    return this.request<ClickUpTask>(`/task/${taskId}`, {
      method: "PUT",
      body: JSON.stringify(params),
    });
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.request<void>(`/task/${taskId}`, {
      method: "DELETE",
    });
  }

  // ===== HELPERS =====

  async getAllTasksInSpace(spaceId: string): Promise<ClickUpTask[]> {
    const allTasks: ClickUpTask[] = [];

    // Get folderless lists
    const folderlessLists = await this.getFolderlessLists(spaceId);
    for (const list of folderlessLists) {
      const tasks = await this.getTasks(list.id, { include_closed: false });
      allTasks.push(...tasks);
    }

    // Get folders and their lists
    const folders = await this.getFolders(spaceId);
    for (const folder of folders) {
      for (const list of folder.lists) {
        const tasks = await this.getTasks(list.id, { include_closed: false });
        allTasks.push(...tasks);
      }
    }

    return allTasks;
  }

  async getMyTasks(userId: number, spaceId?: string): Promise<ClickUpTask[]> {
    // If space specified, get from that space only
    if (spaceId) {
      const allTasks = await this.getAllTasksInSpace(spaceId);
      return allTasks.filter((t) =>
        t.assignees.some((a) => a.id === userId)
      );
    }

    // Otherwise get from all spaces
    const spaces = await this.getSpaces();
    const allTasks: ClickUpTask[] = [];

    for (const space of spaces) {
      const tasks = await this.getAllTasksInSpace(space.id);
      const myTasks = tasks.filter((t) =>
        t.assignees.some((a) => a.id === userId)
      );
      allTasks.push(...myTasks);
    }

    return allTasks;
  }

  async getTasksDueToday(): Promise<ClickUpTask[]> {
    const spaces = await this.getSpaces();
    const allTasks: ClickUpTask[] = [];

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000;

    for (const space of spaces) {
      const folderlessLists = await this.getFolderlessLists(space.id);
      for (const list of folderlessLists) {
        const tasks = await this.getTasks(list.id, {
          include_closed: false,
          due_date_lt: endOfDay,
        });
        allTasks.push(...tasks);
      }

      const folders = await this.getFolders(space.id);
      for (const folder of folders) {
        for (const list of folder.lists) {
          const tasks = await this.getTasks(list.id, {
            include_closed: false,
            due_date_lt: endOfDay,
          });
          allTasks.push(...tasks);
        }
      }
    }

    return allTasks;
  }
}

// CLI usage
if (require.main === module) {
  const token = process.env.CLICKUP_API_TOKEN;
  const teamId = process.env.CLICKUP_TEAM_ID;

  if (!token || !teamId) {
    console.error("CLICKUP_API_TOKEN and CLICKUP_TEAM_ID environment variables required");
    process.exit(1);
  }

  const api = new ClickUpAPI(token, teamId);
  const command = process.argv[2];

  (async () => {
    switch (command) {
      case "spaces":
        console.log(JSON.stringify(await api.getSpaces(), null, 2));
        break;
      case "due-today":
        console.log(JSON.stringify(await api.getTasksDueToday(), null, 2));
        break;
      default:
        console.log("Usage: clickup-api.ts [spaces|due-today]");
    }
  })();
}

export default ClickUpAPI;
