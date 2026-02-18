import type { TokenService, TokenPayload } from "@todo/core/application/ports/outbound/TokenService.js";
import type { Result, AuthenticationError } from "@todo/core/domain/shared/index.js";
import { ok, err, userId, workspaceId } from "@todo/core/domain/shared/index.js";

export class StubTokenService implements TokenService {
  async generate(payload: TokenPayload): Promise<string> {
    return Buffer.from(JSON.stringify(payload)).toString("base64");
  }

  async verify(token: string): Promise<Result<TokenPayload, AuthenticationError>> {
    try {
      const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8")) as {
        userId: string;
        workspaceId: string;
      };
      return ok({
        userId: userId(decoded.userId),
        workspaceId: workspaceId(decoded.workspaceId),
      });
    } catch {
      return err({ type: "AuthenticationError", message: "Invalid token" });
    }
  }
}
