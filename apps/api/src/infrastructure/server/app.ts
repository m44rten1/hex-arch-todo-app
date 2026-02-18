import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import { registerTaskRoutes } from "../../adapters/inbound/http/routes/taskRoutes.js";
import { registerProjectRoutes } from "../../adapters/inbound/http/routes/projectRoutes.js";
import type { AppHandlers } from "../di/container.js";

export interface AppOptions {
  readonly logger?: boolean;
}

export function buildApp(handlers: AppHandlers, options: AppOptions = {}): FastifyInstance {
  const app = Fastify({ logger: options.logger ?? true });

  registerTaskRoutes(app, handlers.tasks);
  registerProjectRoutes(app, handlers.projects);

  app.get("/health", async () => ({ status: "ok" }));

  return app;
}
