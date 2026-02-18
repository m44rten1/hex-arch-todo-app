import type { FastifyInstance } from "fastify";
import { projectId } from "@todo/core/domain/shared/index.js";
import type { CreateProjectHandler } from "@todo/core/application/usecases/projects/CreateProjectHandler.js";
import type { UpdateProjectHandler } from "@todo/core/application/usecases/projects/UpdateProjectHandler.js";
import type { ArchiveProjectHandler } from "@todo/core/application/usecases/projects/ArchiveProjectHandler.js";
import type { UnarchiveProjectHandler } from "@todo/core/application/usecases/projects/UnarchiveProjectHandler.js";
import type { ListProjectsHandler } from "@todo/core/application/usecases/queries/ListProjectsHandler.js";
import type { GetProjectHandler } from "@todo/core/application/usecases/queries/GetProjectHandler.js";
import { createProjectSchema, updateProjectSchema } from "../schemas/projectSchemas.js";
import { domainErrorToHttp, zodValidationError } from "../middleware/errorMapper.js";

export interface ProjectHandlers {
  createProject: CreateProjectHandler;
  updateProject: UpdateProjectHandler;
  archiveProject: ArchiveProjectHandler;
  unarchiveProject: UnarchiveProjectHandler;
  listProjects: ListProjectsHandler;
  getProject: GetProjectHandler;
}

export function registerProjectRoutes(
  app: FastifyInstance,
  handlers: ProjectHandlers,
): void {
  app.post<{ Body: unknown }>("/projects", async (request, reply) => {
    const ctx = request.ctx;
    const parsed = createProjectSchema.safeParse(request.body);
    if (!parsed.success) {
      const err = zodValidationError(parsed.error);
      return reply.status(err.statusCode).send(err.body);
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

  app.patch<{ Params: { id: string }; Body: unknown }>("/projects/:id", async (request, reply) => {
    const parsed = updateProjectSchema.safeParse(request.body);
    if (!parsed.success) {
      const err = zodValidationError(parsed.error);
      return reply.status(err.statusCode).send(err.body);
    }

    const result = await handlers.updateProject.execute({
      projectId: projectId(request.params.id),
      name: parsed.data.name,
      color: parsed.data.color,
    }, request.ctx);

    if (!result.ok) {
      const httpErr = domainErrorToHttp(result.error);
      return reply.status(httpErr.statusCode).send(httpErr.body);
    }

    return reply.send(result.value);
  });

  app.post<{ Params: { id: string } }>("/projects/:id/archive", async (request, reply) => {
    const result = await handlers.archiveProject.execute({
      projectId: projectId(request.params.id),
    }, request.ctx);

    if (!result.ok) {
      const httpErr = domainErrorToHttp(result.error);
      return reply.status(httpErr.statusCode).send(httpErr.body);
    }

    return reply.send(result.value);
  });

  app.post<{ Params: { id: string } }>("/projects/:id/unarchive", async (request, reply) => {
    const result = await handlers.unarchiveProject.execute({
      projectId: projectId(request.params.id),
    }, request.ctx);

    if (!result.ok) {
      const httpErr = domainErrorToHttp(result.error);
      return reply.status(httpErr.statusCode).send(httpErr.body);
    }

    return reply.send(result.value);
  });

  app.get("/projects", async (request, reply) => {
    const projects = await handlers.listProjects.execute(request.ctx);
    return reply.send(projects);
  });

  app.get<{ Params: { id: string } }>("/projects/:id", async (request, reply) => {
    const result = await handlers.getProject.execute({
      type: "GetProject",
      projectId: projectId(request.params.id),
    }, request.ctx);

    if (!result.ok) {
      const httpErr = domainErrorToHttp(result.error);
      return reply.status(httpErr.statusCode).send(httpErr.body);
    }

    return reply.send(result.value);
  });
}
