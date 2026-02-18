import type { TagId, WorkspaceId, Result, ValidationError } from "../shared/index.js";
import { ok, err } from "../shared/index.js";
import type { Tag } from "./Tag.js";

const NAME_MIN_LENGTH = 1;
const NAME_MAX_LENGTH = 50;

export type TagValidationError = ValidationError;

export interface CreateTagParams {
  readonly id: TagId;
  readonly workspaceId: WorkspaceId;
  readonly name: string;
  readonly color?: string;
  readonly now: Date;
}

export interface UpdateTagParams {
  readonly name?: string;
  readonly color?: string | null;
  readonly now: Date;
}

function validateName(name: string): Result<string, TagValidationError> {
  const trimmed = name.trim();
  if (trimmed.length < NAME_MIN_LENGTH) {
    return err({ type: "ValidationError", field: "name", message: "Tag name must not be empty" });
  }
  if (trimmed.length > NAME_MAX_LENGTH) {
    return err({ type: "ValidationError", field: "name", message: `Tag name must not exceed ${NAME_MAX_LENGTH} characters` });
  }
  return ok(trimmed);
}

export function createTag(params: CreateTagParams): Result<Tag, TagValidationError> {
  const nameResult = validateName(params.name);
  if (!nameResult.ok) return nameResult;

  return ok({
    id: params.id,
    workspaceId: params.workspaceId,
    name: nameResult.value,
    color: params.color ?? null,
    createdAt: params.now,
    updatedAt: params.now,
  });
}

export function updateTag(tag: Tag, params: UpdateTagParams): Result<Tag, TagValidationError> {
  if (params.name !== undefined) {
    const nameResult = validateName(params.name);
    if (!nameResult.ok) return nameResult;

    return ok({
      ...tag,
      name: nameResult.value,
      color: params.color !== undefined ? params.color : tag.color,
      updatedAt: params.now,
    });
  }

  return ok({
    ...tag,
    color: params.color !== undefined ? params.color : tag.color,
    updatedAt: params.now,
  });
}
