import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string(),
  projectId: z.string().optional(),
  dueAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().optional(),
  notes: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
  dueAt: z.string().datetime().nullable().optional(),
});

export const taskIdParamSchema = z.object({
  id: z.string(),
});

export type CreateTaskBody = z.infer<typeof createTaskSchema>;
export type UpdateTaskBody = z.infer<typeof updateTaskSchema>;
export type TaskIdParams = z.infer<typeof taskIdParamSchema>;
