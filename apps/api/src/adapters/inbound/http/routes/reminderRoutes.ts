import type { FastifyInstance } from "fastify";
import { taskId, reminderId } from "@todo/core/domain/shared/index.js";
import type { CreateReminderHandler } from "@todo/core/application/usecases/reminders/CreateReminderHandler.js";
import type { UpdateReminderHandler } from "@todo/core/application/usecases/reminders/UpdateReminderHandler.js";
import type { DismissReminderHandler } from "@todo/core/application/usecases/reminders/DismissReminderHandler.js";
import type { DeleteReminderHandler } from "@todo/core/application/usecases/reminders/DeleteReminderHandler.js";
import type { GetTaskRemindersHandler } from "@todo/core/application/usecases/reminders/GetTaskRemindersHandler.js";
import { createReminderSchema, updateReminderSchema } from "../schemas/reminderSchemas.js";
import { domainErrorToHttp, zodValidationError } from "../middleware/errorMapper.js";

export interface ReminderHandlers {
  createReminder: CreateReminderHandler;
  updateReminder: UpdateReminderHandler;
  dismissReminder: DismissReminderHandler;
  deleteReminder: DeleteReminderHandler;
  getTaskReminders: GetTaskRemindersHandler;
}

export function registerReminderRoutes(
  app: FastifyInstance,
  handlers: ReminderHandlers,
): void {
  app.post<{ Params: { taskId: string }; Body: unknown }>(
    "/tasks/:taskId/reminders",
    async (request, reply) => {
      const parsed = createReminderSchema.safeParse(request.body);
      if (!parsed.success) {
        const err = zodValidationError(parsed.error);
        return reply.status(err.statusCode).send(err.body);
      }

      const result = await handlers.createReminder.execute(
        {
          taskId: taskId(request.params.taskId),
          remindAt: new Date(parsed.data.remindAt),
        },
        request.ctx,
      );

      if (!result.ok) {
        const httpErr = domainErrorToHttp(result.error);
        return reply.status(httpErr.statusCode).send(httpErr.body);
      }

      return reply.status(201).send(result.value);
    },
  );

  app.get<{ Params: { taskId: string } }>(
    "/tasks/:taskId/reminders",
    async (request, reply) => {
      const reminders = await handlers.getTaskReminders.execute(
        taskId(request.params.taskId),
        request.ctx,
      );
      return reply.send(reminders);
    },
  );

  app.patch<{ Params: { id: string }; Body: unknown }>(
    "/reminders/:id",
    async (request, reply) => {
      const parsed = updateReminderSchema.safeParse(request.body);
      if (!parsed.success) {
        const err = zodValidationError(parsed.error);
        return reply.status(err.statusCode).send(err.body);
      }

      const result = await handlers.updateReminder.execute(
        {
          reminderId: reminderId(request.params.id),
          remindAt: new Date(parsed.data.remindAt),
        },
        request.ctx,
      );

      if (!result.ok) {
        const httpErr = domainErrorToHttp(result.error);
        return reply.status(httpErr.statusCode).send(httpErr.body);
      }

      return reply.send(result.value);
    },
  );

  app.post<{ Params: { id: string } }>(
    "/reminders/:id/dismiss",
    async (request, reply) => {
      const result = await handlers.dismissReminder.execute(
        { reminderId: reminderId(request.params.id) },
        request.ctx,
      );

      if (!result.ok) {
        const httpErr = domainErrorToHttp(result.error);
        return reply.status(httpErr.statusCode).send(httpErr.body);
      }

      return reply.send(result.value);
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/reminders/:id",
    async (request, reply) => {
      const result = await handlers.deleteReminder.execute(
        { reminderId: reminderId(request.params.id) },
        request.ctx,
      );

      if (!result.ok) {
        const httpErr = domainErrorToHttp(result.error);
        return reply.status(httpErr.statusCode).send(httpErr.body);
      }

      return reply.status(204).send();
    },
  );
}
