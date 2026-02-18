import type { FastifyRequest, FastifyReply } from "fastify";
import type { TokenService } from "@todo/core/application/ports/outbound/TokenService.js";
import type { RequestContext } from "@todo/core/application/RequestContext.js";
import { unauthorized } from "./errorMapper.js";

declare module "fastify" {
  interface FastifyRequest {
    ctx: RequestContext;
  }
}

function extractToken(request: FastifyRequest): string | null {
  const cookieToken = request.cookies?.["token"];
  if (cookieToken) return cookieToken;

  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);

  return null;
}

export function authGuard(tokenService: TokenService) {
  return async function guard(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const token = extractToken(request);
    if (!token) {
      const err = unauthorized("Missing or invalid authorization");
      reply.status(err.statusCode).send(err.body);
      return;
    }

    const result = await tokenService.verify(token);
    if (!result.ok) {
      const err = unauthorized(result.error.message);
      reply.status(err.statusCode).send(err.body);
      return;
    }

    request.ctx = result.value;
  };
}
