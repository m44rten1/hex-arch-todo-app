import { z } from "zod";

export const createTagSchema = z.object({
  name: z.string(),
  color: z.string().optional(),
});

export const updateTagSchema = z.object({
  name: z.string().optional(),
  color: z.string().nullable().optional(),
});
