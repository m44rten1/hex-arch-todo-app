# TODO — Feature Roadmap

What exists today: auth (register/login/logout), task CRUD (create/update/complete/uncomplete/delete), inbox view (active + completed), today view, projects (create/list/get), domain events (published, no subscribers), web frontend (login, register, inbox only), PostgreSQL + in-memory adapters, JWT auth.

---

## Phase 1 — MVP

### Backend

- [x] **Cancel task** — handler + HTTP route (domain rule exists, no use case or endpoint)
- [x] **Soft delete** — replace hard delete with tombstone (`canceled`/`deleted` status or flag) for sync reliability
- [x] **Project management** — update project (rename, color), archive/unarchive project, delete project
- [x] **Tags** — Tag entity, CRUD, task–tag association (join), filter tasks by tag
- [x] **Upcoming view** — query tasks due in next 7/14/30 days, grouped by day
- [x] **Search** — full-text search over title + notes, with filters (status, project, tag, due range)
- [x] **Reminders** — Reminder entity, scheduling, notification delivery (at least one channel)
- [x] **Recurrence** — RecurrenceRule entity, daily/weekly/monthly patterns, auto-create next instance on completion
- [x] **Consistent error contract** — standardize error codes (`VALIDATION_ERROR`, `NOT_FOUND`, `FORBIDDEN`, `CONFLICT`) across all endpoints

### Frontend (web)

- [ ] **App shell & navigation** — sidebar with Inbox, Today, Upcoming, Projects, Tags sections
- [ ] **Today view page**
- [ ] **Upcoming view page**
- [ ] **Project pages** — list, detail with task list, create/edit/archive
- [ ] **Tags pages** — list, filter tasks by tag, manage tags
- [ ] **Task detail / edit** — notes, due date, project, tags, complete/uncomplete/cancel
- [ ] **Search UI**
- [ ] **Reminder UI** — set/edit reminders on tasks

### Offline & Sync

- [ ] **Local data store** — IndexedDB (web) / SQLite (mobile) for offline-first
- [ ] **Outbox + sync engine** — queue local changes, push/pull on reconnect
- [ ] **Conflict resolution** — field-level merge or LWW with conflict surfacing
- [ ] **Sync status UI** — last sync time, pending ops, errors

---

## Phase 2 — V1 (Feature-rich for individuals)

- [ ] **Start date** — "defer until" / hide task before start date
- [ ] **Priority** — 4 levels (low/normal/high/urgent), sort by priority in views
- [ ] **Sections within projects** — Section entity, ordering, drag-and-drop
- [ ] **Subtasks / checklist** — ordered items under a task, individual completion
- [ ] **Smart lists** — saved filter rules, sidebar display
- [ ] **Advanced recurrence** — "every 2 weeks on Tuesday", "last weekday of month", completion-based mode
- [ ] **Attachments** — links (and optionally files)
- [ ] **Templates** — template sets ("Morning routine"), instantiate into project/inbox
- [ ] **Weekly review mode** — guided flow to reschedule stale tasks, clean backlog
- [ ] **Command palette + keyboard shortcuts**

---

## Phase 3 — V2 (Teams, automation, analytics)

- [ ] **Collaboration** — shared projects, roles (Owner/Editor/Viewer), task assignment
- [ ] **Comments + @mentions** — per-task discussion thread
- [ ] **Audit / activity log** — track changes per project/task
- [ ] **Automations** — rules engine subscribing to domain events (e.g. auto-snooze, follow-up tasks)
- [ ] **Public API + integrations** — documented REST API, webhooks
- [ ] **Analytics dashboard** — completion trends, postponed tasks, estimate vs actual

---

## Technical Debt

- [x] **Unit of Work in `RegisterUserHandler`** — introduced `createRegistration()` domain function and `UserRegistrationStore` port; `PgUserRegistrationStore` wraps both inserts in a single transaction.

---

## Cross-cutting (ongoing)

- [ ] **Domain event subscribers** — events are published but nothing reacts to them yet; wire up side-effects (e.g. recurrence, reminders, audit)
- [ ] **Observability** — structured logging with requestId, sync metrics, search latency
- [ ] **Timezone handling** — store UTC + user timezone preference, test DST boundaries
- [ ] **Data export + account deletion**
- [ ] **Internationalization** — i18n for UI strings, locale-aware date formatting
- [ ] **Accessibility** — keyboard nav, screen reader, focus indicators, contrast
