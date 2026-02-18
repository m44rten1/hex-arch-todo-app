import { CreateTaskHandler } from "@todo/core/application/usecases/tasks/CreateTaskHandler.js";
import { UpdateTaskHandler } from "@todo/core/application/usecases/tasks/UpdateTaskHandler.js";
import { CompleteTaskHandler } from "@todo/core/application/usecases/tasks/CompleteTaskHandler.js";
import { UncompleteTaskHandler } from "@todo/core/application/usecases/tasks/UncompleteTaskHandler.js";
import { DeleteTaskHandler } from "@todo/core/application/usecases/tasks/DeleteTaskHandler.js";
import { CancelTaskHandler } from "@todo/core/application/usecases/tasks/CancelTaskHandler.js";
import { CreateProjectHandler } from "@todo/core/application/usecases/projects/CreateProjectHandler.js";
import { UpdateProjectHandler } from "@todo/core/application/usecases/projects/UpdateProjectHandler.js";
import { GetInboxHandler } from "@todo/core/application/usecases/queries/GetInboxHandler.js";
import { GetCompletedInboxHandler } from "@todo/core/application/usecases/queries/GetCompletedInboxHandler.js";
import { GetTodayViewHandler } from "@todo/core/application/usecases/queries/GetTodayViewHandler.js";
import { ListProjectsHandler } from "@todo/core/application/usecases/queries/ListProjectsHandler.js";
import { GetProjectHandler } from "@todo/core/application/usecases/queries/GetProjectHandler.js";
import { RegisterUserHandler } from "@todo/core/application/usecases/auth/RegisterUserHandler.js";
import { LoginUserHandler } from "@todo/core/application/usecases/auth/LoginUserHandler.js";
import { GetMeHandler } from "@todo/core/application/usecases/auth/GetMeHandler.js";
import type { TaskRepo } from "@todo/core/application/ports/outbound/TaskRepo.js";
import type { ProjectRepo } from "@todo/core/application/ports/outbound/ProjectRepo.js";
import type { UserRepo } from "@todo/core/application/ports/outbound/UserRepo.js";
import type { WorkspaceRepo } from "@todo/core/application/ports/outbound/WorkspaceRepo.js";
import type { IdGenerator } from "@todo/core/application/ports/outbound/IdGenerator.js";
import type { Clock } from "@todo/core/domain/shared/Clock.js";
import type { EventBus } from "@todo/core/application/ports/outbound/EventBus.js";
import type { PasswordHasher } from "@todo/core/application/ports/outbound/PasswordHasher.js";
import type { TokenService } from "@todo/core/application/ports/outbound/TokenService.js";
import type { TaskHandlers } from "../../adapters/inbound/http/routes/taskRoutes.js";
import type { ProjectHandlers } from "../../adapters/inbound/http/routes/projectRoutes.js";
import type { AuthHandlers } from "../../adapters/inbound/http/routes/authRoutes.js";

export interface Dependencies {
  readonly taskRepo: TaskRepo;
  readonly projectRepo: ProjectRepo;
  readonly userRepo: UserRepo;
  readonly workspaceRepo: WorkspaceRepo;
  readonly idGenerator: IdGenerator;
  readonly clock: Clock;
  readonly eventBus: EventBus;
  readonly passwordHasher: PasswordHasher;
  readonly tokenService: TokenService;
}

export interface AppHandlers {
  readonly tasks: TaskHandlers;
  readonly projects: ProjectHandlers;
  readonly auth: AuthHandlers;
}

export function wireHandlers(deps: Dependencies): AppHandlers {
  const {
    taskRepo, projectRepo, userRepo, workspaceRepo,
    idGenerator, clock, eventBus, passwordHasher, tokenService,
  } = deps;

  return {
    tasks: {
      createTask: new CreateTaskHandler(taskRepo, idGenerator, clock, eventBus),
      updateTask: new UpdateTaskHandler(taskRepo, clock, eventBus),
      completeTask: new CompleteTaskHandler(taskRepo, clock, eventBus),
      uncompleteTask: new UncompleteTaskHandler(taskRepo, clock, eventBus),
      deleteTask: new DeleteTaskHandler(taskRepo, clock, eventBus),
      cancelTask: new CancelTaskHandler(taskRepo, clock, eventBus),
      getInbox: new GetInboxHandler(taskRepo),
      getCompletedInbox: new GetCompletedInboxHandler(taskRepo),
      getTodayView: new GetTodayViewHandler(taskRepo, clock),
    },
    projects: {
      createProject: new CreateProjectHandler(projectRepo, idGenerator, clock, eventBus),
      updateProject: new UpdateProjectHandler(projectRepo, clock, eventBus),
      listProjects: new ListProjectsHandler(projectRepo),
      getProject: new GetProjectHandler(projectRepo, taskRepo),
    },
    auth: {
      register: new RegisterUserHandler(
        userRepo, workspaceRepo, passwordHasher, tokenService,
        idGenerator, clock, eventBus,
      ),
      login: new LoginUserHandler(userRepo, workspaceRepo, passwordHasher, tokenService),
      getMe: new GetMeHandler(userRepo),
    },
  };
}
