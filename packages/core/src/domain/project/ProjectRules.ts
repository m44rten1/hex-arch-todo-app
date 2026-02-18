import type { ProjectId, WorkspaceId, Result, ValidationError, InvalidStateTransitionError } from "../shared/index.js";
import { ok, err } from "../shared/index.js";
import type { Project } from "./Project.js";

const NAME_MIN_LENGTH = 1;
const NAME_MAX_LENGTH = 100;

export type ProjectValidationError = ValidationError;
export type ProjectStateError = InvalidStateTransitionError;

export interface CreateProjectParams {
  readonly id: ProjectId;
  readonly workspaceId: WorkspaceId;
  readonly name: string;
  readonly color?: string;
  readonly now: Date;
}

export interface UpdateProjectParams {
  readonly name?: string;
  readonly color?: string | null;
  readonly now: Date;
}

function validateName(name: string): Result<string, ProjectValidationError> {
  const trimmed = name.trim();
  if (trimmed.length < NAME_MIN_LENGTH) {
    return err({ type: "ValidationError", field: "name", message: "Project name must not be empty" });
  }
  if (trimmed.length > NAME_MAX_LENGTH) {
    return err({ type: "ValidationError", field: "name", message: `Project name must not exceed ${NAME_MAX_LENGTH} characters` });
  }
  return ok(trimmed);
}

export function createProject(params: CreateProjectParams): Result<Project, ProjectValidationError> {
  const nameResult = validateName(params.name);
  if (!nameResult.ok) return nameResult;

  return ok({
    id: params.id,
    workspaceId: params.workspaceId,
    name: nameResult.value,
    color: params.color ?? null,
    archived: false,
    createdAt: params.now,
    updatedAt: params.now,
  });
}

export function updateProject(project: Project, params: UpdateProjectParams): Result<Project, ProjectValidationError> {
  if (params.name !== undefined) {
    const nameResult = validateName(params.name);
    if (!nameResult.ok) return nameResult;

    return ok({
      ...project,
      name: nameResult.value,
      color: params.color !== undefined ? params.color : project.color,
      updatedAt: params.now,
    });
  }

  return ok({
    ...project,
    color: params.color !== undefined ? params.color : project.color,
    updatedAt: params.now,
  });
}

export function archiveProject(project: Project, now: Date): Result<Project, ProjectStateError> {
  if (project.archived) {
    return err({
      type: "InvalidStateTransitionError",
      entity: "Project",
      from: "archived",
      to: "archived",
      message: "Project is already archived",
    });
  }
  return ok({ ...project, archived: true, updatedAt: now });
}

export function unarchiveProject(project: Project, now: Date): Result<Project, ProjectStateError> {
  if (!project.archived) {
    return err({
      type: "InvalidStateTransitionError",
      entity: "Project",
      from: "active",
      to: "active",
      message: "Project is not archived",
    });
  }
  return ok({ ...project, archived: false, updatedAt: now });
}
