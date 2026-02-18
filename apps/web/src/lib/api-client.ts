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
  createdAt: string;
  updatedAt: string;
}

export const api = {
  register: (email: string, password: string) =>
    request<AuthResponse>("POST", "/auth/register", { email, password }),

  login: (email: string, password: string) =>
    request<AuthResponse>("POST", "/auth/login", { email, password }),

  logout: () => request<void>("POST", "/auth/logout"),

  getMe: () => request<{ user: UserDTO | null }>("GET", "/auth/me"),

  getInbox: () => request<TaskDTO[]>("GET", "/inbox"),

  getCompletedInbox: () => request<TaskDTO[]>("GET", "/inbox/completed"),

  createTask: (title: string) =>
    request<TaskDTO>("POST", "/tasks", { title }),

  updateTask: (taskId: string, data: { title?: string }) =>
    request<TaskDTO>("PATCH", `/tasks/${taskId}`, data),

  completeTask: (taskId: string) =>
    request<TaskDTO>("POST", `/tasks/${taskId}/complete`),

  uncompleteTask: (taskId: string) =>
    request<TaskDTO>("POST", `/tasks/${taskId}/uncomplete`),

  deleteTask: (taskId: string) =>
    request<void>("DELETE", `/tasks/${taskId}`),
};
