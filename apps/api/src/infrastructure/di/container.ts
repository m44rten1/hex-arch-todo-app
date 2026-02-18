import { CreateTaskHandler } from "@todo/core/application/usecases/tasks/CreateTaskHandler.js";
import { UpdateTaskHandler } from "@todo/core/application/usecases/tasks/UpdateTaskHandler.js";
import { CompleteTaskHandler } from "@todo/core/application/usecases/tasks/CompleteTaskHandler.js";
import { UncompleteTaskHandler } from "@todo/core/application/usecases/tasks/UncompleteTaskHandler.js";
import { DeleteTaskHandler } from "@todo/core/application/usecases/tasks/DeleteTaskHandler.js";
import { CancelTaskHandler } from "@todo/core/application/usecases/tasks/CancelTaskHandler.js";
import { SearchTasksHandler } from "@todo/core/application/usecases/search/SearchTasksHandler.js";
import { CreateProjectHandler } from "@todo/core/application/usecases/projects/CreateProjectHandler.js";
import { UpdateProjectHandler } from "@todo/core/application/usecases/projects/UpdateProjectHandler.js";
import { ArchiveProjectHandler } from "@todo/core/application/usecases/projects/ArchiveProjectHandler.js";
import { UnarchiveProjectHandler } from "@todo/core/application/usecases/projects/UnarchiveProjectHandler.js";
import { DeleteProjectHandler } from "@todo/core/application/usecases/projects/DeleteProjectHandler.js";
import { GetInboxHandler } from "@todo/core/application/usecases/queries/GetInboxHandler.js";
import { GetCompletedInboxHandler } from "@todo/core/application/usecases/queries/GetCompletedInboxHandler.js";
import { GetTodayViewHandler } from "@todo/core/application/usecases/queries/GetTodayViewHandler.js";
import { GetUpcomingViewHandler } from "@todo/core/application/usecases/queries/GetUpcomingViewHandler.js";
import { ListProjectsHandler } from "@todo/core/application/usecases/queries/ListProjectsHandler.js";
import { GetProjectHandler } from "@todo/core/application/usecases/queries/GetProjectHandler.js";
import { RegisterUserHandler } from "@todo/core/application/usecases/auth/RegisterUserHandler.js";
import { LoginUserHandler } from "@todo/core/application/usecases/auth/LoginUserHandler.js";
import { GetMeHandler } from "@todo/core/application/usecases/auth/GetMeHandler.js";
import { CreateTagHandler } from "@todo/core/application/usecases/tags/CreateTagHandler.js";
import { UpdateTagHandler } from "@todo/core/application/usecases/tags/UpdateTagHandler.js";
import { DeleteTagHandler } from "@todo/core/application/usecases/tags/DeleteTagHandler.js";
import { ListTagsHandler } from "@todo/core/application/usecases/tags/ListTagsHandler.js";
import { GetTasksByTagHandler } from "@todo/core/application/usecases/queries/GetTasksByTagHandler.js";
import { CreateReminderHandler } from "@todo/core/application/usecases/reminders/CreateReminderHandler.js";
import { UpdateReminderHandler } from "@todo/core/application/usecases/reminders/UpdateReminderHandler.js";
import { DismissReminderHandler } from "@todo/core/application/usecases/reminders/DismissReminderHandler.js";
import { DeleteReminderHandler } from "@todo/core/application/usecases/reminders/DeleteReminderHandler.js";
import { GetTaskRemindersHandler } from "@todo/core/application/usecases/reminders/GetTaskRemindersHandler.js";
import { ProcessDueRemindersHandler } from "@todo/core/application/usecases/reminders/ProcessDueRemindersHandler.js";
import { SetRecurrenceRuleHandler } from "@todo/core/application/usecases/recurrence/SetRecurrenceRuleHandler.js";
import { RemoveRecurrenceRuleHandler } from "@todo/core/application/usecases/recurrence/RemoveRecurrenceRuleHandler.js";
import { GetTaskRecurrenceHandler } from "@todo/core/application/usecases/recurrence/GetTaskRecurrenceHandler.js";
import type { TaskRepo } from "@todo/core/application/ports/outbound/TaskRepo.js";
import type { ProjectRepo } from "@todo/core/application/ports/outbound/ProjectRepo.js";
import type { UserRepo } from "@todo/core/application/ports/outbound/UserRepo.js";
import type { WorkspaceRepo } from "@todo/core/application/ports/outbound/WorkspaceRepo.js";
import type { UserRegistrationStore } from "@todo/core/application/ports/outbound/UserRegistrationStore.js";
import type { SearchIndex } from "@todo/core/application/ports/outbound/SearchIndex.js";
import type { ReminderRepo } from "@todo/core/application/ports/outbound/ReminderRepo.js";
import type { RecurrenceRuleRepo } from "@todo/core/application/ports/outbound/RecurrenceRuleRepo.js";
import type { NotificationChannel } from "@todo/core/application/ports/outbound/NotificationChannel.js";
import type { IdGenerator } from "@todo/core/application/ports/outbound/IdGenerator.js";
import type { Clock } from "@todo/core/domain/shared/Clock.js";
import type { EventBus } from "@todo/core/application/ports/outbound/EventBus.js";
import type { PasswordHasher } from "@todo/core/application/ports/outbound/PasswordHasher.js";
import type { TokenService } from "@todo/core/application/ports/outbound/TokenService.js";
import type { TaskHandlers } from "../../adapters/inbound/http/routes/taskRoutes.js";
import type { ProjectHandlers } from "../../adapters/inbound/http/routes/projectRoutes.js";
import type { TagHandlers } from "../../adapters/inbound/http/routes/tagRoutes.js";
import type { ReminderHandlers } from "../../adapters/inbound/http/routes/reminderRoutes.js";
import type { RecurrenceHandlers } from "../../adapters/inbound/http/routes/recurrenceRoutes.js";
import type { AuthHandlers } from "../../adapters/inbound/http/routes/authRoutes.js";
import type { TagRepo } from "@todo/core/application/ports/outbound/TagRepo.js";

export interface Dependencies {
  readonly taskRepo: TaskRepo;
  readonly projectRepo: ProjectRepo;
  readonly tagRepo: TagRepo;
  readonly userRepo: UserRepo;
  readonly workspaceRepo: WorkspaceRepo;
  readonly registrationStore: UserRegistrationStore;
  readonly searchIndex: SearchIndex;
  readonly reminderRepo: ReminderRepo;
  readonly recurrenceRuleRepo: RecurrenceRuleRepo;
  readonly notificationChannel: NotificationChannel;
  readonly idGenerator: IdGenerator;
  readonly clock: Clock;
  readonly eventBus: EventBus;
  readonly passwordHasher: PasswordHasher;
  readonly tokenService: TokenService;
}

export interface AppHandlers {
  readonly tasks: TaskHandlers;
  readonly projects: ProjectHandlers;
  readonly tags: TagHandlers;
  readonly reminders: ReminderHandlers;
  readonly recurrence: RecurrenceHandlers;
  readonly auth: AuthHandlers;
  readonly processDueReminders: ProcessDueRemindersHandler;
}

export function wireHandlers(deps: Dependencies): AppHandlers {
  const {
    taskRepo, projectRepo, tagRepo, userRepo, workspaceRepo, registrationStore,
    searchIndex, reminderRepo, recurrenceRuleRepo, notificationChannel,
    idGenerator, clock, eventBus, passwordHasher, tokenService,
  } = deps;

  return {
    tasks: {
      createTask: new CreateTaskHandler(taskRepo, idGenerator, clock, eventBus),
      updateTask: new UpdateTaskHandler(taskRepo, clock, eventBus),
      completeTask: new CompleteTaskHandler(taskRepo, recurrenceRuleRepo, idGenerator, clock, eventBus),
      uncompleteTask: new UncompleteTaskHandler(taskRepo, clock, eventBus),
      deleteTask: new DeleteTaskHandler(taskRepo, clock, eventBus),
      cancelTask: new CancelTaskHandler(taskRepo, clock, eventBus),
      getInbox: new GetInboxHandler(taskRepo),
      getCompletedInbox: new GetCompletedInboxHandler(taskRepo),
      getUpcomingView: new GetUpcomingViewHandler(taskRepo, clock),
      getTodayView: new GetTodayViewHandler(taskRepo, clock),
      searchTasks: new SearchTasksHandler(searchIndex),
    },
    projects: {
      createProject: new CreateProjectHandler(projectRepo, idGenerator, clock, eventBus),
      updateProject: new UpdateProjectHandler(projectRepo, clock, eventBus),
      archiveProject: new ArchiveProjectHandler(projectRepo, clock, eventBus),
      unarchiveProject: new UnarchiveProjectHandler(projectRepo, clock, eventBus),
      deleteProject: new DeleteProjectHandler(projectRepo, clock, eventBus),
      listProjects: new ListProjectsHandler(projectRepo),
      getProject: new GetProjectHandler(projectRepo, taskRepo),
    },
    tags: {
      createTag: new CreateTagHandler(tagRepo, idGenerator, clock, eventBus),
      updateTag: new UpdateTagHandler(tagRepo, clock, eventBus),
      deleteTag: new DeleteTagHandler(tagRepo, clock, eventBus),
      listTags: new ListTagsHandler(tagRepo),
      getTasksByTag: new GetTasksByTagHandler(taskRepo),
    },
    reminders: {
      createReminder: new CreateReminderHandler(taskRepo, reminderRepo, idGenerator, clock, eventBus),
      updateReminder: new UpdateReminderHandler(reminderRepo, clock),
      dismissReminder: new DismissReminderHandler(reminderRepo, clock, eventBus),
      deleteReminder: new DeleteReminderHandler(reminderRepo),
      getTaskReminders: new GetTaskRemindersHandler(reminderRepo),
    },
    recurrence: {
      setRecurrenceRule: new SetRecurrenceRuleHandler(taskRepo, recurrenceRuleRepo, idGenerator, clock, eventBus),
      removeRecurrenceRule: new RemoveRecurrenceRuleHandler(taskRepo, recurrenceRuleRepo, clock, eventBus),
      getTaskRecurrence: new GetTaskRecurrenceHandler(taskRepo, recurrenceRuleRepo),
    },
    auth: {
      register: new RegisterUserHandler(
        registrationStore, passwordHasher, tokenService,
        idGenerator, clock, eventBus,
      ),
      login: new LoginUserHandler(userRepo, workspaceRepo, passwordHasher, tokenService),
      getMe: new GetMeHandler(userRepo),
    },
    processDueReminders: new ProcessDueRemindersHandler(
      reminderRepo, taskRepo, notificationChannel, clock, eventBus,
    ),
  };
}
