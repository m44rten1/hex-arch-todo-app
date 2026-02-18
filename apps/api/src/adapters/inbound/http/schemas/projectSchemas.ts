import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string(),
  color: z.string().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().optional(),
  color: z.string().nullable().optional(),
});

export const projectIdParamSchema = z.object({
  id: z.string(),
});

export type CreateProjectBody = z.infer<typeof createProjectSchema>;
export type ProjectIdParams = z.infer<typeof projectIdParamSchema>;
