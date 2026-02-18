import Fastify from "fastify";
import cookie from "@fastify/cookie";
import type { FastifyInstance } from "fastify";
import type { TokenService } from "@todo/core/application/ports/outbound/TokenService.js";
import { registerPublicAuthRoutes, registerAuthRoutes } from "../../adapters/inbound/http/routes/authRoutes.js";
import { registerTaskRoutes } from "../../adapters/inbound/http/routes/taskRoutes.js";
import { registerProjectRoutes } from "../../adapters/inbound/http/routes/projectRoutes.js";
import { registerTagRoutes } from "../../adapters/inbound/http/routes/tagRoutes.js";
import { registerReminderRoutes } from "../../adapters/inbound/http/routes/reminderRoutes.js";
import { registerRecurrenceRoutes } from "../../adapters/inbound/http/routes/recurrenceRoutes.js";
import { authGuard } from "../../adapters/inbound/http/middleware/authGuard.js";
import type { AppHandlers } from "../di/container.js";
import type { ErrorCode } from "../../adapters/inbound/http/middleware/errorMapper.js";

export interface AppOptions {
  readonly logger?: boolean;
}

export function buildApp(
  handlers: AppHandlers,
  tokenService: TokenService,
  options: AppOptions = {},
): FastifyInstance {
  const app = Fastify({ logger: options.logger ?? true });

  app.setErrorHandler((error: Error & { statusCode?: number }, _request, reply) => {
    app.log.error(error);
    const statusCode = error.statusCode ?? 500;
    const code: ErrorCode = statusCode >= 500 ? "INTERNAL_ERROR" : "VALIDATION_ERROR";
    reply.status(statusCode).send({ code, message: statusCode >= 500 ? "Internal server error" : error.message });
  });

  app.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({ code: "NOT_FOUND" satisfies ErrorCode, message: "Route not found" });
  });

  app.register(cookie);
  app.decorateRequest("ctx", undefined as never);

  registerPublicAuthRoutes(app, handlers.auth);
  app.get("/health", async () => ({ status: "ok" }));

  app.register(async (protectedScope) => {
    protectedScope.addHook("onRequest", authGuard(tokenService));
    registerAuthRoutes(protectedScope, handlers.auth);
    registerTaskRoutes(protectedScope, handlers.tasks);
    registerProjectRoutes(protectedScope, handlers.projects);
    registerTagRoutes(protectedScope, handlers.tags);
    registerReminderRoutes(protectedScope, handlers.reminders);
    registerRecurrenceRoutes(protectedScope, handlers.recurrence);
  });

  return app;
}
