import type { DomainError } from "@todo/core/domain/shared/index.js";

interface HttpError {
  readonly statusCode: number;
  readonly body: {
    readonly code: string;
    readonly message: string;
    readonly field?: string;
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
