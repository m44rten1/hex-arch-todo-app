import type { TaskDTO } from "./TaskDTO.js";

export interface TodayViewDTO {
  readonly overdue: readonly TaskDTO[];
  readonly dueToday: readonly TaskDTO[];
}
