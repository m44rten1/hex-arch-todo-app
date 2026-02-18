import type { UserId, WorkspaceId, Result, AuthenticationError } from "../../../domain/shared/index.js";

export interface TokenPayload {
  readonly userId: UserId;
  readonly workspaceId: WorkspaceId;
}

export interface TokenService {
  generate(payload: TokenPayload): Promise<string>;
  verify(token: string): Promise<Result<TokenPayload, AuthenticationError>>;
}
