import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import type { TokenService } from "@todo/core/application/ports/outbound/TokenService.js";
import { registerAuthRoutes } from "../../adapters/inbound/http/routes/authRoutes.js";
import { registerTaskRoutes } from "../../adapters/inbound/http/routes/taskRoutes.js";
import { registerProjectRoutes } from "../../adapters/inbound/http/routes/projectRoutes.js";
import { authGuard } from "../../adapters/inbound/http/middleware/authGuard.js";
import type { AppHandlers } from "../di/container.js";

export interface AppOptions {
  readonly logger?: boolean;
}

export function buildApp(
  handlers: AppHandlers,
  tokenService: TokenService,
  options: AppOptions = {},
): FastifyInstance {
  const app = Fastify({ logger: options.logger ?? true });

  app.decorateRequest("ctx", undefined as never);

  registerAuthRoutes(app, handlers.auth);
  app.get("/health", async () => ({ status: "ok" }));

  app.register(async (protectedScope) => {
    protectedScope.addHook("onRequest", authGuard(tokenService));
    registerTaskRoutes(protectedScope, handlers.tasks);
    registerProjectRoutes(protectedScope, handlers.projects);
  });

  return app;
}
