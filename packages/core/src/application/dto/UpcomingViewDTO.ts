import type { TaskDTO } from "./TaskDTO.js";

export interface UpcomingDayGroup {
  readonly date: string;
  readonly tasks: readonly TaskDTO[];
}

export interface UpcomingViewDTO {
  readonly days: number;
  readonly groups: readonly UpcomingDayGroup[];
}
