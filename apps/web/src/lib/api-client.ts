const BASE = "/api";

export interface ApiError {
  readonly code: string;
  readonly message: string;
  readonly field?: string;
}

export class ApiRequestError extends Error {
  readonly status: number;
  readonly body: ApiError;

  constructor(status: number, body: ApiError) {
    super(body.message);
    this.status = status;
    this.body = body;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {};

  if (body !== undefined) {
    headers["content-type"] = "application/json";
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const json: unknown = await res.json();

  if (!res.ok) {
    throw new ApiRequestError(res.status, json as ApiError);
  }

  return json as T;
}

// --- DTOs ---

export interface UserDTO {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: UserDTO;
}

export interface TaskDTO {
  id: string;
  title: string;
  status: string;
  notes: string | null;
  projectId: string | null;
  dueAt: string | null;
  completedAt: string | null;
  tagIds: string[];
  deletedAt: string | null;
  recurrenceRuleId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDTO {
  id: string;
  name: string;
  color: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TagDTO {
  id: string;
  name: string;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TodayViewDTO {
  overdue: TaskDTO[];
  dueToday: TaskDTO[];
}

export interface UpcomingDayGroup {
  date: string;
  tasks: TaskDTO[];
}

export interface UpcomingViewDTO {
  days: number;
  groups: UpcomingDayGroup[];
}

export interface ReminderDTO {
  id: string;
  taskId: string;
  remindAt: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecurrenceRuleDTO {
  id: string;
  taskId: string;
  frequency: string;
  interval: number;
  daysOfWeek: number[] | null;
  dayOfMonth: number | null;
  mode: string;
  createdAt: string;
  updatedAt: string;
}

// --- API methods ---

export interface UpdateTaskData {
  title?: string;
  notes?: string | null;
  projectId?: string | null;
  dueAt?: string | null;
  tagIds?: string[];
}

export interface SearchParams {
  q: string;
  projectId?: string;
  tagIds?: string[];
  status?: string;
  dueBefore?: string;
  dueAfter?: string;
}

export const api = {
  // Auth
  register: (email: string, password: string) =>
    request<AuthResponse>("POST", "/auth/register", { email, password }),

  login: (email: string, password: string) =>
    request<AuthResponse>("POST", "/auth/login", { email, password }),

  logout: () => request<void>("POST", "/auth/logout"),

  getMe: () => request<{ user: UserDTO | null }>("GET", "/auth/me"),

  // Tasks
  getInbox: () => request<TaskDTO[]>("GET", "/inbox"),

  getCompletedInbox: () => request<TaskDTO[]>("GET", "/inbox/completed"),

  createTask: (data: { title: string; projectId?: string; dueAt?: string; notes?: string; tagIds?: string[] }) =>
    request<TaskDTO>("POST", "/tasks", data),

  updateTask: (taskId: string, data: UpdateTaskData) =>
    request<TaskDTO>("PATCH", `/tasks/${taskId}`, data),

  completeTask: (taskId: string) =>
    request<TaskDTO>("POST", `/tasks/${taskId}/complete`),

  uncompleteTask: (taskId: string) =>
    request<TaskDTO>("POST", `/tasks/${taskId}/uncomplete`),

  cancelTask: (taskId: string) =>
    request<TaskDTO>("POST", `/tasks/${taskId}/cancel`),

  deleteTask: (taskId: string) =>
    request<void>("DELETE", `/tasks/${taskId}`),

  // Views
  getToday: () => request<TodayViewDTO>("GET", "/today"),

  getUpcoming: (days?: number) =>
    request<UpcomingViewDTO>("GET", days ? `/upcoming?days=${days}` : "/upcoming"),

  // Search
  searchTasks: (params: SearchParams) => {
    const qs = new URLSearchParams();
    qs.set("q", params.q);
    if (params.projectId) qs.set("projectId", params.projectId);
    if (params.tagIds?.length) qs.set("tagIds", params.tagIds.join(","));
    if (params.status) qs.set("status", params.status);
    if (params.dueBefore) qs.set("dueBefore", params.dueBefore);
    if (params.dueAfter) qs.set("dueAfter", params.dueAfter);
    return request<TaskDTO[]>("GET", `/search?${qs.toString()}`);
  },

  // Projects
  getProjects: () => request<ProjectDTO[]>("GET", "/projects"),

  getProject: (projectId: string) =>
    request<ProjectDTO>("GET", `/projects/${projectId}`),

  createProject: (data: { name: string; color?: string }) =>
    request<ProjectDTO>("POST", "/projects", data),

  updateProject: (projectId: string, data: { name?: string; color?: string | null }) =>
    request<ProjectDTO>("PATCH", `/projects/${projectId}`, data),

  archiveProject: (projectId: string) =>
    request<ProjectDTO>("POST", `/projects/${projectId}/archive`),

  unarchiveProject: (projectId: string) =>
    request<ProjectDTO>("POST", `/projects/${projectId}/unarchive`),

  deleteProject: (projectId: string) =>
    request<void>("DELETE", `/projects/${projectId}`),

  // Tags
  getTags: () => request<TagDTO[]>("GET", "/tags"),

  createTag: (data: { name: string; color?: string }) =>
    request<TagDTO>("POST", "/tags", data),

  updateTag: (tagId: string, data: { name?: string; color?: string | null }) =>
    request<TagDTO>("PATCH", `/tags/${tagId}`, data),

  deleteTag: (tagId: string) =>
    request<void>("DELETE", `/tags/${tagId}`),

  getTagTasks: (tagId: string) =>
    request<TaskDTO[]>("GET", `/tags/${tagId}/tasks`),

  // Reminders
  getReminders: (taskId: string) =>
    request<ReminderDTO[]>("GET", `/tasks/${taskId}/reminders`),

  createReminder: (taskId: string, remindAt: string) =>
    request<ReminderDTO>("POST", `/tasks/${taskId}/reminders`, { remindAt }),

  updateReminder: (reminderId: string, remindAt: string) =>
    request<ReminderDTO>("PATCH", `/reminders/${reminderId}`, { remindAt }),

  dismissReminder: (reminderId: string) =>
    request<ReminderDTO>("POST", `/reminders/${reminderId}/dismiss`),

  deleteReminder: (reminderId: string) =>
    request<void>("DELETE", `/reminders/${reminderId}`),

  // Recurrence
  getRecurrence: (taskId: string) =>
    request<RecurrenceRuleDTO>("GET", `/tasks/${taskId}/recurrence`),

  setRecurrence: (taskId: string, data: { frequency: string; interval?: number; daysOfWeek?: number[]; dayOfMonth?: number; mode?: string }) =>
    request<RecurrenceRuleDTO>("PUT", `/tasks/${taskId}/recurrence`, data),

  removeRecurrence: (taskId: string) =>
    request<void>("DELETE", `/tasks/${taskId}/recurrence`),
};
