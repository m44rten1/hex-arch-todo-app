import type { FastifyInstance } from "fastify";
import { taskId } from "@todo/core/domain/shared/index.js";
import type { SetRecurrenceRuleHandler } from "@todo/core/application/usecases/recurrence/SetRecurrenceRuleHandler.js";
import type { RemoveRecurrenceRuleHandler } from "@todo/core/application/usecases/recurrence/RemoveRecurrenceRuleHandler.js";
import type { GetTaskRecurrenceHandler } from "@todo/core/application/usecases/recurrence/GetTaskRecurrenceHandler.js";
import { setRecurrenceRuleSchema } from "../schemas/recurrenceSchemas.js";
import { domainErrorToHttp, zodValidationError } from "../middleware/errorMapper.js";

export interface RecurrenceHandlers {
  setRecurrenceRule: SetRecurrenceRuleHandler;
  removeRecurrenceRule: RemoveRecurrenceRuleHandler;
  getTaskRecurrence: GetTaskRecurrenceHandler;
}

export function registerRecurrenceRoutes(
  app: FastifyInstance,
  handlers: RecurrenceHandlers,
): void {
  app.put<{ Params: { taskId: string }; Body: unknown }>(
    "/tasks/:taskId/recurrence",
    async (request, reply) => {
      const parsed = setRecurrenceRuleSchema.safeParse(request.body);
      if (!parsed.success) {
        const err = zodValidationError(parsed.error);
        return reply.status(err.statusCode).send(err.body);
      }

      const result = await handlers.setRecurrenceRule.execute(
        {
          taskId: taskId(request.params.taskId),
          frequency: parsed.data.frequency,
          interval: parsed.data.interval,
          daysOfWeek: parsed.data.daysOfWeek,
          dayOfMonth: parsed.data.dayOfMonth,
          mode: parsed.data.mode,
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

  app.delete<{ Params: { taskId: string } }>(
    "/tasks/:taskId/recurrence",
    async (request, reply) => {
      const result = await handlers.removeRecurrenceRule.execute(
        { taskId: taskId(request.params.taskId) },
        request.ctx,
      );

      if (!result.ok) {
        const httpErr = domainErrorToHttp(result.error);
        return reply.status(httpErr.statusCode).send(httpErr.body);
      }

      return reply.status(204).send();
    },
  );

  app.get<{ Params: { taskId: string } }>(
    "/tasks/:taskId/recurrence",
    async (request, reply) => {
      const result = await handlers.getTaskRecurrence.execute(
        taskId(request.params.taskId),
        request.ctx,
      );

      if (!result.ok) {
        const httpErr = domainErrorToHttp(result.error);
        return reply.status(httpErr.statusCode).send(httpErr.body);
      }

      return reply.send(result.value);
    },
  );
}
