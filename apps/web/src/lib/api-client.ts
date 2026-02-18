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

let tokenRef: string | null = null;

export function setToken(token: string | null) {
  tokenRef = token;
}

export function getToken(): string | null {
  return tokenRef;
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
  if (tokenRef) {
    headers["authorization"] = `Bearer ${tokenRef}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const json: unknown = await res.json();

  if (!res.ok) {
    throw new ApiRequestError(res.status, json as ApiError);
  }

  return json as T;
}

export interface AuthResponse {
  token: string;
  user: { id: string; email: string; createdAt: string; updatedAt: string };
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

  getInbox: () => request<TaskDTO[]>("GET", "/inbox"),

  completeTask: (taskId: string) =>
    request<TaskDTO>("POST", `/tasks/${taskId}/complete`),
};
