import type { FastifyInstance } from "fastify";
import { projectId } from "@todo/core/domain/shared/index.js";
import type { CreateProjectHandler } from "@todo/core/application/usecases/projects/CreateProjectHandler.js";
import type { ListProjectsHandler } from "@todo/core/application/usecases/queries/ListProjectsHandler.js";
import type { GetProjectHandler } from "@todo/core/application/usecases/queries/GetProjectHandler.js";
import { createProjectSchema } from "../schemas/projectSchemas.js";
import { extractContext } from "../middleware/authContext.js";
import { domainErrorToHttp } from "../middleware/errorMapper.js";

export interface ProjectHandlers {
  createProject: CreateProjectHandler;
  listProjects: ListProjectsHandler;
  getProject: GetProjectHandler;
}

export function registerProjectRoutes(
  app: FastifyInstance,
  handlers: ProjectHandlers,
): void {
  app.post<{ Body: unknown }>("/projects", async (request, reply) => {
    const ctx = extractContext(request);
    const parsed = createProjectSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Invalid request body",
      });
    }

    const result = await handlers.createProject.execute(
      { name: parsed.data.name, color: parsed.data.color },
      ctx,
    );

    if (!result.ok) {
      const httpErr = domainErrorToHttp(result.error);
      return reply.status(httpErr.statusCode).send(httpErr.body);
    }

    return reply.status(201).send(result.value);
  });

  app.get("/projects", async (request, reply) => {
    const ctx = extractContext(request);
    const projects = await handlers.listProjects.execute(ctx);
    return reply.send(projects);
  });

  app.get<{ Params: { id: string } }>("/projects/:id", async (request, reply) => {
    const result = await handlers.getProject.execute({
      type: "GetProject",
      projectId: projectId(request.params.id),
    });

    if (!result.ok) {
      const httpErr = domainErrorToHttp(result.error);
      return reply.status(httpErr.statusCode).send(httpErr.body);
    }

    return reply.send(result.value);
  });
}
