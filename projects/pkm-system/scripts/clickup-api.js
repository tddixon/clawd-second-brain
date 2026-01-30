"use strict";
/**
 * ClickUp API Integration
 * https://clickup.com/api/
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClickUpAPI = void 0;
const CLICKUP_BASE_URL = "https://api.clickup.com/api/v2";
class ClickUpAPI {
    constructor(token, teamId) {
        this.token = token;
        this.teamId = teamId;
    }
    async request(endpoint, options = {}) {
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
    async getSpaces() {
        const result = await this.request(`/team/${this.teamId}/space`);
        return result.spaces;
    }
    async getSpace(spaceId) {
        return this.request(`/space/${spaceId}`);
    }
    // ===== FOLDERS =====
    async getFolders(spaceId) {
        const result = await this.request(`/space/${spaceId}/folder`);
        return result.folders;
    }
    // ===== LISTS =====
    async getLists(folderId) {
        const result = await this.request(`/folder/${folderId}/list`);
        return result.lists;
    }
    async getFolderlessLists(spaceId) {
        const result = await this.request(`/space/${spaceId}/list`);
        return result.lists;
    }
    // ===== TASKS =====
    async getTasks(listId, options) {
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
        const result = await this.request(`/list/${listId}/task${query ? `?${query}` : ""}`);
        return result.tasks;
    }
    async getTask(taskId) {
        return this.request(`/task/${taskId}`);
    }
    async createTask(listId, params) {
        return this.request(`/list/${listId}/task`, {
            method: "POST",
            body: JSON.stringify(params),
        });
    }
    async updateTask(taskId, params) {
        return this.request(`/task/${taskId}`, {
            method: "PUT",
            body: JSON.stringify(params),
        });
    }
    async deleteTask(taskId) {
        await this.request(`/task/${taskId}`, {
            method: "DELETE",
        });
    }
    // ===== HELPERS =====
    async getAllTasksInSpace(spaceId) {
        const allTasks = [];
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
    async getMyTasks(userId, spaceId) {
        // If space specified, get from that space only
        if (spaceId) {
            const allTasks = await this.getAllTasksInSpace(spaceId);
            return allTasks.filter((t) => t.assignees.some((a) => a.id === userId));
        }
        // Otherwise get from all spaces
        const spaces = await this.getSpaces();
        const allTasks = [];
        for (const space of spaces) {
            const tasks = await this.getAllTasksInSpace(space.id);
            const myTasks = tasks.filter((t) => t.assignees.some((a) => a.id === userId));
            allTasks.push(...myTasks);
        }
        return allTasks;
    }
    async getTasksDueToday() {
        const spaces = await this.getSpaces();
        const allTasks = [];
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
exports.ClickUpAPI = ClickUpAPI;
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
exports.default = ClickUpAPI;
