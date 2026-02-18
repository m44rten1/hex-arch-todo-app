import { z } from "zod";
import { TASK_STATUSES } from "@todo/core/domain/task/TaskRules.js";

export const searchTasksSchema = z.object({
  q: z.string().min(1, "Search query cannot be empty"),
  projectId: z.string().optional(),
  tagIds: z.string().optional().transform(v => v ? v.split(",").filter(Boolean) : undefined),
  status: z.enum(TASK_STATUSES).optional(),
  dueBefore: z.string().datetime().optional(),
  dueAfter: z.string().datetime().optional(),
});

export type SearchTasksQuery = z.infer<typeof searchTasksSchema>;

export const createTaskSchema = z.object({
  title: z.string(),
  projectId: z.string().optional(),
  dueAt: z.string().datetime().optional(),
  notes: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().optional(),
  notes: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
  dueAt: z.string().datetime().nullable().optional(),
  tagIds: z.array(z.string()).optional(),
});

export const taskIdParamSchema = z.object({
  id: z.string(),
});

export type CreateTaskBody = z.infer<typeof createTaskSchema>;
export type UpdateTaskBody = z.infer<typeof updateTaskSchema>;
export type TaskIdParams = z.infer<typeof taskIdParamSchema>;
