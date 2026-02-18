import { SignJWT, jwtVerify } from "jose";
import type { TokenService, TokenPayload } from "@todo/core/application/ports/outbound/TokenService.js";
import type { Result, AuthenticationError } from "@todo/core/domain/shared/index.js";
import { ok, err, userId, workspaceId } from "@todo/core/domain/shared/index.js";

const ALG = "HS256";
const TOKEN_EXPIRY = "7d";

export class JoseTokenService implements TokenService {
  private readonly secret: Uint8Array;

  constructor(secret: string) {
    this.secret = new TextEncoder().encode(secret);
  }

  async generate(payload: TokenPayload): Promise<string> {
    return new SignJWT({
      uid: payload.userId as string,
      wid: payload.workspaceId as string,
    })
      .setProtectedHeader({ alg: ALG })
      .setIssuedAt()
      .setExpirationTime(TOKEN_EXPIRY)
      .sign(this.secret);
  }

  async verify(token: string): Promise<Result<TokenPayload, AuthenticationError>> {
    try {
      const { payload } = await jwtVerify(token, this.secret);
      const uid = payload["uid"];
      const wid = payload["wid"];

      if (typeof uid !== "string" || typeof wid !== "string") {
        return err({ type: "AuthenticationError", message: "Malformed token payload" });
      }

      return ok({
        userId: userId(uid),
        workspaceId: workspaceId(wid),
      });
    } catch {
      return err({ type: "AuthenticationError", message: "Invalid or expired token" });
    }
  }
}
