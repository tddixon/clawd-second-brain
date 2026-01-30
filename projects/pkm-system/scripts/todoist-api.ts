/**
 * Todoist API Integration
 * https://developer.todoist.com/rest/v2/
 */

const TODOIST_BASE_URL = "https://api.todoist.com/rest/v2";

interface TodoistTask {
  id: string;
  content: string;
  description: string;
  project_id: string;
  section_id: string | null;
  parent_id: string | null;
  order: number;
  priority: number; // 1-4, where 4 is highest
  due: {
    date: string;
    string: string;
    datetime?: string;
    timezone?: string;
  } | null;
  labels: string[];
  created_at: string;
  is_completed: boolean;
}

interface TodoistProject {
  id: string;
  name: string;
  color: string;
  parent_id: string | null;
  order: number;
  is_favorite: boolean;
}

interface CreateTaskParams {
  content: string;
  description?: string;
  project_id?: string;
  due_string?: string;
  due_date?: string;
  priority?: number;
  labels?: string[];
}

export class TodoistAPI {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${TODOIST_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Todoist API error: ${response.status} ${response.statusText}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // ===== TASKS =====

  async getTasks(filter?: {
    project_id?: string;
    label?: string;
    filter?: string; // Todoist filter query
  }): Promise<TodoistTask[]> {
    const params = new URLSearchParams();
    if (filter?.project_id) params.append("project_id", filter.project_id);
    if (filter?.label) params.append("label", filter.label);
    if (filter?.filter) params.append("filter", filter.filter);

    const query = params.toString();
    return this.request<TodoistTask[]>(`/tasks${query ? `?${query}` : ""}`);
  }

  async getTask(taskId: string): Promise<TodoistTask> {
    return this.request<TodoistTask>(`/tasks/${taskId}`);
  }

  async createTask(params: CreateTaskParams): Promise<TodoistTask> {
    return this.request<TodoistTask>("/tasks", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async updateTask(
    taskId: string,
    params: Partial<CreateTaskParams>
  ): Promise<TodoistTask> {
    return this.request<TodoistTask>(`/tasks/${taskId}`, {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async closeTask(taskId: string): Promise<void> {
    await this.request<void>(`/tasks/${taskId}/close`, {
      method: "POST",
    });
  }

  async reopenTask(taskId: string): Promise<void> {
    await this.request<void>(`/tasks/${taskId}/reopen`, {
      method: "POST",
    });
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.request<void>(`/tasks/${taskId}`, {
      method: "DELETE",
    });
  }

  // ===== PROJECTS =====

  async getProjects(): Promise<TodoistProject[]> {
    return this.request<TodoistProject[]>("/projects");
  }

  async getProject(projectId: string): Promise<TodoistProject> {
    return this.request<TodoistProject>(`/projects/${projectId}`);
  }

  // ===== INBOX HELPERS =====

  async getInboxTasks(): Promise<TodoistTask[]> {
    const projects = await this.getProjects();
    const inbox = projects.find(p => p.name === "Inbox");
    if (!inbox) return [];
    return this.getTasks({ project_id: inbox.id });
  }

  async getTodayTasks(): Promise<TodoistTask[]> {
    return this.getTasks({ filter: "today | overdue" });
  }
}

// CLI usage
if (require.main === module) {
  const token = process.env.TODOIST_API_TOKEN;
  if (!token) {
    console.error("TODOIST_API_TOKEN environment variable required");
    process.exit(1);
  }

  const api = new TodoistAPI(token);
  const command = process.argv[2];

  (async () => {
    switch (command) {
      case "inbox":
        console.log(JSON.stringify(await api.getInboxTasks(), null, 2));
        break;
      case "today":
        console.log(JSON.stringify(await api.getTodayTasks(), null, 2));
        break;
      case "tasks":
        console.log(JSON.stringify(await api.getTasks(), null, 2));
        break;
      case "projects":
        console.log(JSON.stringify(await api.getProjects(), null, 2));
        break;
      default:
        console.log("Usage: todoist-api.ts [inbox|today|tasks|projects]");
    }
  })();
}

export default TodoistAPI;
