import type { FastifyInstance } from "fastify";
import { taskId, projectId } from "@todo/core/domain/shared/index.js";
import type { CreateTaskHandler } from "@todo/core/application/usecases/tasks/CreateTaskHandler.js";
import type { UpdateTaskHandler } from "@todo/core/application/usecases/tasks/UpdateTaskHandler.js";
import type { CompleteTaskHandler } from "@todo/core/application/usecases/tasks/CompleteTaskHandler.js";
import type { UncompleteTaskHandler } from "@todo/core/application/usecases/tasks/UncompleteTaskHandler.js";
import type { DeleteTaskHandler } from "@todo/core/application/usecases/tasks/DeleteTaskHandler.js";
import type { GetInboxHandler } from "@todo/core/application/usecases/queries/GetInboxHandler.js";
import type { GetTodayViewHandler } from "@todo/core/application/usecases/queries/GetTodayViewHandler.js";
import { createTaskSchema, updateTaskSchema } from "../schemas/taskSchemas.js";
import { domainErrorToHttp } from "../middleware/errorMapper.js";

export interface TaskHandlers {
  createTask: CreateTaskHandler;
  updateTask: UpdateTaskHandler;
  completeTask: CompleteTaskHandler;
  uncompleteTask: UncompleteTaskHandler;
  deleteTask: DeleteTaskHandler;
  getInbox: GetInboxHandler;
  getTodayView: GetTodayViewHandler;
}

export function registerTaskRoutes(
  app: FastifyInstance,
  handlers: TaskHandlers,
): void {
  app.post<{ Body: unknown }>("/tasks", async (request, reply) => {
    const ctx = request.ctx;
    const parsed = createTaskSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Invalid request body",
      });
    }

    const result = await handlers.createTask.execute(
      {
        title: parsed.data.title,
        projectId: parsed.data.projectId ? projectId(parsed.data.projectId) : undefined,
        dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : undefined,
        notes: parsed.data.notes,
      },
      ctx,
    );

    if (!result.ok) {
      const httpErr = domainErrorToHttp(result.error);
      return reply.status(httpErr.statusCode).send(httpErr.body);
    }

    return reply.status(201).send(result.value);
  });

  app.patch<{ Params: { id: string }; Body: unknown }>("/tasks/:id", async (request, reply) => {
    const parsed = updateTaskSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Invalid request body",
      });
    }

    const result = await handlers.updateTask.execute({
      taskId: taskId(request.params.id),
      title: parsed.data.title,
      notes: parsed.data.notes,
      projectId: parsed.data.projectId !== undefined
        ? (parsed.data.projectId !== null ? projectId(parsed.data.projectId) : null)
        : undefined,
      dueAt: parsed.data.dueAt !== undefined
        ? (parsed.data.dueAt !== null ? new Date(parsed.data.dueAt) : null)
        : undefined,
    }, request.ctx);

    if (!result.ok) {
      const httpErr = domainErrorToHttp(result.error);
      return reply.status(httpErr.statusCode).send(httpErr.body);
    }

    return reply.send(result.value);
  });

  app.post<{ Params: { id: string } }>("/tasks/:id/complete", async (request, reply) => {
    const result = await handlers.completeTask.execute({
      taskId: taskId(request.params.id),
    }, request.ctx);

    if (!result.ok) {
      const httpErr = domainErrorToHttp(result.error);
      return reply.status(httpErr.statusCode).send(httpErr.body);
    }

    return reply.send(result.value);
  });

  app.post<{ Params: { id: string } }>("/tasks/:id/uncomplete", async (request, reply) => {
    const result = await handlers.uncompleteTask.execute({
      taskId: taskId(request.params.id),
    }, request.ctx);

    if (!result.ok) {
      const httpErr = domainErrorToHttp(result.error);
      return reply.status(httpErr.statusCode).send(httpErr.body);
    }

    return reply.send(result.value);
  });

  app.delete<{ Params: { id: string } }>("/tasks/:id", async (request, reply) => {
    const result = await handlers.deleteTask.execute({
      taskId: taskId(request.params.id),
    }, request.ctx);

    if (!result.ok) {
      const httpErr = domainErrorToHttp(result.error);
      return reply.status(httpErr.statusCode).send(httpErr.body);
    }

    return reply.status(204).send();
  });

  app.get("/inbox", async (request, reply) => {
    const tasks = await handlers.getInbox.execute(request.ctx);
    return reply.send(tasks);
  });

  app.get("/today", async (request, reply) => {
    const view = await handlers.getTodayView.execute(request.ctx);
    return reply.send(view);
  });
}
