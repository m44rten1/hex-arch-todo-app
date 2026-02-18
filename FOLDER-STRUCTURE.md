repo/
apps/
web/ # web UI (React/Vue/etc)
src/
ui/
pages/
state/
offline/
main.tsx
test/

    mobile/                      # optional native wrapper (RN/Capacitor)
      src/
        ui/
        native/
        offline/
        main.ts
      test/

    api/                         # server: HTTP + auth + sync + notifications
      src/
        adapters/
          inbound/
            http/
              routes.ts
              controllers/
              middleware/
              presenters/
          outbound/
            db/
              postgres/
              migrations/
            notifications/
              push/
              email/
            auth/
            search/
            telemetry/
        infrastructure/
          config/
          di/
          server/
          main.ts
      test/

packages/
core/ # THE hexagon: domain + application ports/usecases
src/
domain/
tasks/
Task.ts
TaskId.ts
Subtask.ts
TaskRules.ts
TaskEvents.ts
projects/
Project.ts
Section.ts
ProjectEvents.ts
tags/
Tag.ts
reminders/
Reminder.ts
ReminderEvents.ts
recurrence/
RecurrenceRule.ts
recurrenceEngine.ts
RecurrenceEvents.ts
smartlists/
SmartList.ts
smartListEvaluator.ts
workspaces/
Workspace.ts
roles.ts
shared/
Result.ts
Errors.ts
DomainEvent.ts
Clock.ts # interface only
Id.ts # helpers for branded IDs
time.ts # pure helpers (no Date.now)

        application/
          ports/
            inbound/
              commands/
                CreateTask.ts
                UpdateTask.ts
                CompleteTask.ts
                UncompleteTask.ts
                CancelTask.ts
                CreateProject.ts
                CreateTag.ts
                CreateReminder.ts
                CreateSmartList.ts
                RunWeeklyReview.ts
                ApplySyncPull.ts
                ProduceSyncPush.ts
              queries/
                GetTodayView.ts
                GetUpcomingView.ts
                SearchTasks.ts
                GetInbox.ts
            outbound/
              TaskRepo.ts
              ProjectRepo.ts
              TagRepo.ts
              ReminderRepo.ts
              RecurrenceRuleRepo.ts
              SmartListRepo.ts
              WorkspaceRepo.ts
              SearchIndex.ts
              NotificationScheduler.ts
              AuthVerifier.ts
              UnitOfWork.ts
              Outbox.ts            # queue of ops/events awaiting push
              SyncCursorStore.ts
              EventBus.ts
              IdGenerator.ts
              TransactionClock.ts  # if you want deterministic timestamps

          usecases/
            tasks/
              CreateTaskHandler.ts
              UpdateTaskHandler.ts
              CompleteTaskHandler.ts
              UncompleteTaskHandler.ts
              CancelTaskHandler.ts
            planning/
              GetTodayViewHandler.ts
              GetUpcomingViewHandler.ts
              RunWeeklyReviewHandler.ts
            search/
              SearchTasksHandler.ts
            reminders/
              CreateReminderHandler.ts
            recurrence/
              AdvanceRecurrenceOnCompleteHandler.ts
            sync/
              ProduceSyncPushHandler.ts
              ApplySyncPullHandler.ts
              ResolveConflicts.ts     # deterministic merge policy

          dto/
            TaskDTO.ts
            ProjectDTO.ts
            SyncDTO.ts
          policies/
            Authorization.ts         # roles/capabilities (V2-ready)

      test/
        domain/
        application/

    sync/                         # offline-first engine shared by clients
      src/
        model/
          Op.ts                    # ops-based: {id, type, entity, payload, ts, actor}
          Cursor.ts
          Conflict.ts
        decide/
          commandToOps.ts          # pure: command -> ops
          merge.ts                 # pure: op/op or state/state merges
          rebase.ts                # pure: rebase local ops on pulled ops
        storage/
          OutboxStore.ts           # interface
          SnapshotStore.ts         # interface (optional)
        ports/
          SyncTransport.ts         # push/pull abstraction
          Clock.ts                 # interface
        engine/
          SyncEngine.ts            # imperative shell orchestrator
          backoff.ts
      test/
        property/                  # chaos tests: random multi-device edit sequences
        unit/

    local-store/                   # local DB adapters (web + mobile)
      src/
        ports/
          LocalTaskStore.ts        # CRUD + query, backed by IndexedDB/SQLite
          LocalSearchIndex.ts
        indexeddb/
          IndexedDbTaskStore.ts
          IndexedDbOutboxStore.ts
          migrations/
        sqlite/
          SqliteTaskStore.ts
          SqliteOutboxStore.ts
          migrations/
      test/

    notifications/                 # client-side scheduling + UI glue
      src/
        ports/
          LocalNotifier.ts         # schedule/cancel local notifications
        web/
          WebNotifier.ts
        mobile/
          MobileNotifier.ts
      test/

    api-client/                    # typed HTTP client used by web/mobile
      src/
        http/
          fetchClient.ts
          errorContract.ts
        endpoints/
          tasks.ts
          projects.ts
          tags.ts
          sync.ts
      test/

tooling/
eslint/
tsconfig/
scripts/

docs/
spec/
adr/

package.json
pnpm-workspace.yaml
