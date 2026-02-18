import type { FastifyRequest } from "fastify";
import { userId, workspaceId } from "@todo/core/domain/shared/index.js";
import type { RequestContext } from "@todo/core/application/RequestContext.js";

export function extractContext(request: FastifyRequest): RequestContext {
  const uid = (request.headers["x-user-id"] as string | undefined) ?? "default-user";
  const wsId = (request.headers["x-workspace-id"] as string | undefined) ?? "default-workspace";

  return {
    userId: userId(uid),
    workspaceId: workspaceId(wsId),
  };
}
