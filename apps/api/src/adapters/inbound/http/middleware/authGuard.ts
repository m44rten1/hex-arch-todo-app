import type { FastifyRequest, FastifyReply } from "fastify";
import type { TokenService } from "@todo/core/application/ports/outbound/TokenService.js";
import type { RequestContext } from "@todo/core/application/RequestContext.js";

declare module "fastify" {
  interface FastifyRequest {
    ctx: RequestContext;
  }
}

export function authGuard(tokenService: TokenService) {
  return async function guard(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      reply.status(401).send({ code: "UNAUTHORIZED", message: "Missing or invalid authorization header" });
      return;
    }

    const token = authHeader.slice(7);
    const result = await tokenService.verify(token);

    if (!result.ok) {
      reply.status(401).send({ code: "UNAUTHORIZED", message: result.error.message });
      return;
    }

    request.ctx = result.value;
  };
}
