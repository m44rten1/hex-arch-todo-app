import { z } from "zod";

export const setRecurrenceRuleSchema = z.object({
  frequency: z.enum(["daily", "weekly", "monthly"]),
  interval: z.number().int().min(1).optional(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  mode: z.enum(["fixedSchedule", "fromCompletion"]).optional(),
});

export type SetRecurrenceRuleBody = z.infer<typeof setRecurrenceRuleSchema>;
