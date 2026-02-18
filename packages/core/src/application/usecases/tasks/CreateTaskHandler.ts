import type { Result } from "../../../domain/shared/index.js";
import { createTask } from "../../../domain/task/TaskRules.js";
import type { TaskValidationError } from "../../../domain/task/TaskRules.js";
import type { TaskDTO } from "../../dto/TaskDTO.js";
import { toTaskDTO } from "../../dto/TaskDTO.js";
import type { CreateTaskCommand } from "../../ports/inbound/commands/CreateTask.js";
import type { TaskRepo } from "../../ports/outbound/TaskRepo.js";
import type { IdGenerator } from "../../ports/outbound/IdGenerator.js";
import type { Clock } from "../../../domain/shared/Clock.js";
import type { EventBus } from "../../ports/outbound/EventBus.js";
import type { RequestContext } from "../../RequestContext.js";
import type { TaskCreated } from "../../../domain/task/TaskEvents.js";

export class CreateTaskHandler {
  private readonly taskRepo: TaskRepo;
  private readonly idGenerator: IdGenerator;
  private readonly clock: Clock;
  private readonly eventBus: EventBus;

  constructor(taskRepo: TaskRepo, idGenerator: IdGenerator, clock: Clock, eventBus: EventBus) {
    this.taskRepo = taskRepo;
    this.idGenerator = idGenerator;
    this.clock = clock;
    this.eventBus = eventBus;
  }

  async execute(
    cmd: CreateTaskCommand,
    ctx: RequestContext,
  ): Promise<Result<TaskDTO, TaskValidationError>> {
    const id = this.idGenerator.taskId();
    const now = this.clock.now();

    const result = createTask({
      id,
      title: cmd.title,
      now,
      userId: ctx.userId,
      workspaceId: ctx.workspaceId,
      projectId: cmd.projectId,
      dueAt: cmd.dueAt,
      notes: cmd.notes,
    });

    if (!result.ok) return result;

    await this.taskRepo.save(result.value);

    const event: TaskCreated = {
      type: "TaskCreated",
      taskId: result.value.id,
      title: result.value.title,
      workspaceId: result.value.workspaceId,
      ownerUserId: result.value.ownerUserId,
      projectId: result.value.projectId,
      occurredAt: now,
    };
    await this.eventBus.publish(event);

    return { ok: true, value: toTaskDTO(result.value) };
  }
}
