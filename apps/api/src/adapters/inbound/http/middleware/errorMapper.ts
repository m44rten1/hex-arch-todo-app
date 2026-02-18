import type { DomainError } from "@todo/core/domain/shared/index.js";
import type { ZodError } from "zod";

export interface HttpError {
  readonly statusCode: number;
  readonly body: {
    readonly code: string;
    readonly message: string;
    readonly field?: string;
  };
}

export function unauthorized(message: string): HttpError {
  return { statusCode: 401, body: { code: "UNAUTHORIZED", message } };
}

export function zodValidationError(error: ZodError): HttpError {
  return {
    statusCode: 400,
    body: { code: "VALIDATION_ERROR", message: error.issues[0]?.message ?? "Invalid request body" },
  };
}

export function domainErrorToHttp(error: DomainError): HttpError {
  switch (error.type) {
    case "ValidationError":
      return {
        statusCode: 400,
        body: { code: "VALIDATION_ERROR", message: error.message, field: error.field },
      };
    case "NotFoundError":
      return {
        statusCode: 404,
        body: { code: "NOT_FOUND", message: `${error.entity} not found` },
      };
    case "InvalidStateTransitionError":
      return {
        statusCode: 409,
        body: { code: "CONFLICT", message: error.message },
      };
    case "AuthenticationError":
      return {
        statusCode: 401,
        body: { code: "UNAUTHORIZED", message: error.message },
      };
    case "ConflictError":
      return {
        statusCode: 409,
        body: { code: "CONFLICT", message: error.message },
      };
  }
}
