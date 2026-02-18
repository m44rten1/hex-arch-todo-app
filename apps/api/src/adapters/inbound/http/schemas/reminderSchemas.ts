import { z } from "zod";

export const createReminderSchema = z.object({
  remindAt: z.string().datetime(),
});

export const updateReminderSchema = z.object({
  remindAt: z.string().datetime(),
});

export const reminderIdParamSchema = z.object({
  id: z.string(),
});

export const taskIdParamSchema = z.object({
  taskId: z.string(),
});

export type CreateReminderBody = z.infer<typeof createReminderSchema>;
export type UpdateReminderBody = z.infer<typeof updateReminderSchema>;
