export interface ValidationError {
  readonly type: "ValidationError";
  readonly field: string;
  readonly message: string;
}

export interface NotFoundError {
  readonly type: "NotFoundError";
  readonly entity: string;
  readonly id: string;
}

export interface InvalidStateTransitionError {
  readonly type: "InvalidStateTransitionError";
  readonly entity: string;
  readonly from: string;
  readonly to: string;
  readonly message: string;
}

export type DomainError =
  | ValidationError
  | NotFoundError
  | InvalidStateTransitionError;
