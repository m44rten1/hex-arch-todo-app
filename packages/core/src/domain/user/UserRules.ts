import type { UserId, Result, ValidationError } from "../shared/index.js";
import { ok, err } from "../shared/index.js";
import type { User } from "./User.js";

const PASSWORD_MIN_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type UserValidationError = ValidationError;

export interface CreateUserParams {
  readonly id: UserId;
  readonly email: string;
  readonly passwordHash: string;
  readonly now: Date;
}

export function validateEmail(email: string): Result<string, UserValidationError> {
  const trimmed = email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(trimmed)) {
    return err({ type: "ValidationError", field: "email", message: "Invalid email address" });
  }
  return ok(trimmed);
}

export function validatePassword(password: string): Result<string, UserValidationError> {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return err({
      type: "ValidationError",
      field: "password",
      message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
    });
  }
  return ok(password);
}

export function createUser(params: CreateUserParams): Result<User, UserValidationError> {
  const emailResult = validateEmail(params.email);
  if (!emailResult.ok) return emailResult;

  return ok({
    id: params.id,
    email: emailResult.value,
    passwordHash: params.passwordHash,
    createdAt: params.now,
    updatedAt: params.now,
  });
}
