/**
 * Toggl Track API Integration
 * https://engineering.toggl.com/docs/
 */

const TOGGL_BASE_URL = "https://api.track.toggl.com/api/v9";
const TOGGL_REPORTS_URL = "https://api.track.toggl.com/reports/api/v3";

interface TogglTimeEntry {
  id: number;
  workspace_id: number;
  project_id: number | null;
  task_id: number | null;
  billable: boolean;
  start: string; // ISO datetime
  stop: string | null; // null if running
  duration: number; // seconds, negative if running
  description: string;
  tags: string[];
  tag_ids: number[];
  duronly: boolean;
  at: string; // last modified
  server_deleted_at: string | null;
  user_id: number;
}

interface TogglProject {
  id: number;
  workspace_id: number;
  client_id: number | null;
  name: string;
  is_private: boolean;
  active: boolean;
  color: string;
  billable: boolean;
  actual_hours: number;
  created_at: string;
}

interface TogglWorkspace {
  id: number;
  name: string;
  organization_id: number;
  default_hourly_rate: number | null;
  default_currency: string;
  only_admins_may_create_projects: boolean;
  only_admins_see_billable_rates: boolean;
  only_admins_see_team_dashboard: boolean;
}

interface CreateTimeEntryParams {
  workspace_id: number;
  description?: string;
  project_id?: number;
  task_id?: number;
  billable?: boolean;
  start: string; // ISO datetime
  stop?: string; // ISO datetime
  duration?: number; // seconds
  tags?: string[];
  created_with?: string;
}

interface TimeReport {
  groups: Array<{
    id: number | null;
    sub_groups?: Array<{
      id: number | null;
      title: string;
      seconds: number;
    }>;
    seconds: number;
  }>;
  seconds: number;
}

export class TogglAPI {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private getAuthHeader(): string {
    return `Basic ${Buffer.from(`${this.token}:api_token`).toString("base64")}`;
  }

  private async request<T>(
    baseUrl: string,
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: this.getAuthHeader(),
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Toggl API error: ${response.status} ${text}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // ===== WORKSPACES =====

  async getWorkspaces(): Promise<TogglWorkspace[]> {
    return this.request<TogglWorkspace[]>(TOGGL_BASE_URL, "/me/workspaces");
  }

  // ===== PROJECTS =====

  async getProjects(workspaceId: number): Promise<TogglProject[]> {
    return this.request<TogglProject[]>(
      TOGGL_BASE_URL,
      `/workspaces/${workspaceId}/projects`
    );
  }

  async createProject(
    workspaceId: number,
    name: string,
    options?: {
      color?: string;
      billable?: boolean;
      client_id?: number;
    }
  ): Promise<TogglProject> {
    return this.request<TogglProject>(
      TOGGL_BASE_URL,
      `/workspaces/${workspaceId}/projects`,
      {
        method: "POST",
        body: JSON.stringify({
          name,
          ...options,
        }),
      }
    );
  }

  // ===== TIME ENTRIES =====

  async getCurrentTimeEntry(): Promise<TogglTimeEntry | null> {
    return this.request<TogglTimeEntry | null>(
      TOGGL_BASE_URL,
      "/me/time_entries/current"
    );
  }

  async getTimeEntries(options?: {
    start_date?: string; // ISO date
    end_date?: string; // ISO date
  }): Promise<TogglTimeEntry[]> {
    const params = new URLSearchParams();
    if (options?.start_date) params.append("start_date", options.start_date);
    if (options?.end_date) params.append("end_date", options.end_date);

    const query = params.toString();
    return this.request<TogglTimeEntry[]>(
      TOGGL_BASE_URL,
      `/me/time_entries${query ? `?${query}` : ""}`
    );
  }

  async createTimeEntry(params: CreateTimeEntryParams): Promise<TogglTimeEntry> {
    return this.request<TogglTimeEntry>(
      TOGGL_BASE_URL,
      `/workspaces/${params.workspace_id}/time_entries`,
      {
        method: "POST",
        body: JSON.stringify({
          ...params,
          created_with: params.created_with || "clawd-pkm",
        }),
      }
    );
  }

  async startTimeEntry(
    workspaceId: number,
    description: string,
    projectId?: number
  ): Promise<TogglTimeEntry> {
    const now = new Date().toISOString();
    return this.createTimeEntry({
      workspace_id: workspaceId,
      description,
      project_id: projectId,
      start: now,
      duration: -1, // Negative duration = running
      created_with: "clawd-pkm",
    });
  }

  async stopTimeEntry(
    workspaceId: number,
    timeEntryId: number
  ): Promise<TogglTimeEntry> {
    return this.request<TogglTimeEntry>(
      TOGGL_BASE_URL,
      `/workspaces/${workspaceId}/time_entries/${timeEntryId}/stop`,
      { method: "PATCH" }
    );
  }

  async updateTimeEntry(
    workspaceId: number,
    timeEntryId: number,
    params: Partial<CreateTimeEntryParams>
  ): Promise<TogglTimeEntry> {
    return this.request<TogglTimeEntry>(
      TOGGL_BASE_URL,
      `/workspaces/${workspaceId}/time_entries/${timeEntryId}`,
      {
        method: "PUT",
        body: JSON.stringify(params),
      }
    );
  }

  async deleteTimeEntry(workspaceId: number, timeEntryId: number): Promise<void> {
    await this.request<void>(
      TOGGL_BASE_URL,
      `/workspaces/${workspaceId}/time_entries/${timeEntryId}`,
      { method: "DELETE" }
    );
  }

  // ===== REPORTS =====

  async getSummaryReport(
    workspaceId: number,
    options: {
      start_date: string; // YYYY-MM-DD
      end_date: string; // YYYY-MM-DD
      grouping?: "projects" | "clients" | "users";
      sub_grouping?: "projects" | "tasks" | "time_entries";
    }
  ): Promise<TimeReport> {
    return this.request<TimeReport>(
      TOGGL_REPORTS_URL,
      `/workspace/${workspaceId}/summary/time_entries`,
      {
        method: "POST",
        body: JSON.stringify({
          start_date: options.start_date,
          end_date: options.end_date,
          grouping: options.grouping || "projects",
          sub_grouping: options.sub_grouping || "time_entries",
        }),
      }
    );
  }

  // ===== HELPERS =====

  async getTodayEntries(): Promise<TogglTimeEntry[]> {
    const today = new Date().toISOString().split("T")[0];
    return this.getTimeEntries({
      start_date: today,
      end_date: today,
    });
  }

  async getTodaySummary(workspaceId: number): Promise<{
    total_seconds: number;
    by_project: Record<string, number>;
  }> {
    const entries = await this.getTodayEntries();
    const projects = await this.getProjects(workspaceId);
    const projectMap = new Map(projects.map((p) => [p.id, p.name]));

    let totalSeconds = 0;
    const byProject: Record<string, number> = {};

    for (const entry of entries) {
      const duration = entry.duration > 0 ? entry.duration : 0;
      totalSeconds += duration;

      const projectName = entry.project_id
        ? projectMap.get(entry.project_id) || "Unknown"
        : "No Project";
      byProject[projectName] = (byProject[projectName] || 0) + duration;
    }

    return { total_seconds: totalSeconds, by_project: byProject };
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}

// CLI usage
if (require.main === module) {
  const token = process.env.TOGGL_API_TOKEN;

  if (!token) {
    console.error("TOGGL_API_TOKEN environment variable required");
    process.exit(1);
  }

  const api = new TogglAPI(token);
  const command = process.argv[2];

  (async () => {
    switch (command) {
      case "workspaces":
        console.log(JSON.stringify(await api.getWorkspaces(), null, 2));
        break;
      case "current":
        console.log(JSON.stringify(await api.getCurrentTimeEntry(), null, 2));
        break;
      case "today":
        console.log(JSON.stringify(await api.getTodayEntries(), null, 2));
        break;
      default:
        console.log("Usage: toggl-api.ts [workspaces|current|today]");
    }
  })();
}

export default TogglAPI;
