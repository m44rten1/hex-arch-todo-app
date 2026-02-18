# Todo App — Comprehensive Product & Technical Specification

**Document status:** Draft (handoff-ready)
**Audience:** Product, Engineering, QA, Design, Security
**Goal:** Build a feature-rich, offline-capable, cross-platform todo app with strong organization, planning, and (optional) collaboration.

---

## 1. Summary

Build a modern task management system that supports:

- Fast capture (inbox-first)
- Organization (projects, tags, smart lists)
- Planning (Today/Upcoming, start/due, recurring)
- Reminders/notifications
- Offline-first sync with robust conflict handling
- Optional collaboration (shared projects, roles)
- Optional automations and analytics (later phases)

---

## 2. Goals & Non-Goals

### 2.1 Goals

- **Reliable** offline-first experience: user can fully use the app without connectivity.
- **Fast** capture and search: “add task” and “find task” must feel instant.
- **Flexible** organization: projects, tags, sections, subtasks, templates.
- **Predictable** sync and conflict resolution.
- **Extensible** architecture for automation, analytics, collaboration.

### 2.2 Non-Goals (initially)

- Full calendar replacement (we can integrate, but not rebuild Google Calendar).
- Full project management suite (no Gantt charts in early phases).
- Complex enterprise SSO (possible later).

---

## 3. Personas & Primary Use Cases

### 3.1 Personas

- **Solo user:** personal tasks, reminders, recurring chores.
- **Power user:** keyboard-driven, smart lists, automation.
- **Small team:** shared projects, assignments, activity history.

### 3.2 Use Cases

- Capture tasks quickly throughout the day.
- Triage inbox into projects/tags and schedule.
- Work from Today list with reminders.
- Review weekly: reschedule stale tasks, clean backlog.
- Team project coordination (optional): assign, comment, track changes.

---

## 4. Platforms & UX Principles

### 4.1 Platforms (target)

- **Web app** (desktop-first)
- **Mobile app** (iOS/Android) OR responsive PWA
- **Optional desktop** (Electron/Tauri) — not required for first launch

### 4.2 UX Principles

- **Inbox-first:** capture without thinking; organize later.
- **Happy path is one-click:** complete, reschedule, tag, move.
- **Power features are discoverable:** command palette, shortcuts.
- **Consistency:** same core model and behavior across platforms.

---

## 5. Feature Scope by Phase

### 5.1 Phase 1 — MVP (Launchable)

**Core**

- Accounts + authentication
- Task CRUD + complete/uncomplete
- Inbox
- Projects
- Tags
- Today view (due today + scheduled today)
- Upcoming view (next 7/14/30 days)
- Search (title + notes)
- Reminders (basic)
- Recurrence (simple daily/weekly/monthly)
- Offline-first local store + sync when online

**Nice-to-have (if time)**

- Subtasks (checklist)
- Basic templates

### 5.2 Phase 2 — V1 (Feature-rich for Individuals)

- Start date (“defer until…”)
- Priority
- Sections within projects (Backlog / Doing / Done)
- Smart lists (saved filters)
- Advanced recurrence rules
- Attachments (links; files optional)
- Weekly review mode
- Command palette + full keyboard shortcuts

### 5.3 Phase 3 — V2 (Teams, Automation, Analytics)

- Collaboration: shared projects, roles, assignments
- Comments + @mentions
- Audit/activity log
- Automations (rules engine)
- Public API + integrations
- Analytics dashboard

---

## 6. Domain Model (Conceptual)

### 6.1 Task Fields

Required:

- `id` (UUID)
- `title` (string, 1..200)
- `status` (`active | completed | canceled`)
- `createdAt`, `updatedAt` (timestamps)
- `ownerUserId`
- `workspaceId` (personal workspace exists for each user)

Optional:

- `notes` (markdown, max length TBD)
- `projectId`
- `sectionId`
- `dueAt` (timestamp with timezone semantics)
- `startAt` (timestamp)
- `completedAt` (timestamp)
- `priority` (`low | normal | high | urgent` OR integer 0..3)
- `tags[]` (via join)
- `estimateMinutes` (int, >=0)
- `subtasks[]` (checklist items with own IDs)
- `attachments[]` (URLs; file references optional)
- `recurrenceRuleId` (if recurring)
- `parentTaskId` (optional, for hierarchical tasks if used later)
- `dependencies[]` (optional, later phase)

### 6.2 Project

- `id`, `workspaceId`, `name`, `color`, `archived`, timestamps

### 6.3 Section (Project columns)

- `id`, `projectId`, `name`, `order`

### 6.4 Tag

- `id`, `workspaceId`, `name`, `color`

### 6.5 Reminder

- `id`, `taskId`, `remindAt`, `channel` (`push|email`), `status`

### 6.6 RecurrenceRule

- `id`, `taskId` (or template task)
- pattern: daily/weekly/monthly + interval + BYDAY etc. (see §9.4)

### 6.7 Workspace

- Personal workspace per user by default
- Team workspaces in V2

---

## 7. Core Views & Behaviors

### 7.1 Inbox

- Default landing for new tasks (unless created inside a project).
- Bulk triage actions:
  - Assign project
  - Add tags
  - Set due/start
  - Set priority
  - Delete / cancel

### 7.2 Today

Rules:

- Show tasks with `dueAt` in today OR explicitly “scheduled” for today (if scheduling is implemented separately).
- Overdue tasks appear at top with “Overdue” section.
- Quick actions: complete, snooze, set due time, move project, tag.

### 7.3 Upcoming

- Calendar-like list grouped by day
- Includes tasks due in selected range (7/14/30 days)
- Ability to drag/move due date (platform-dependent)

### 7.4 Projects

- List projects; selecting one shows:
  - Sections (if enabled)
  - Task list with filters (active/completed)
  - Archive/unarchive project

### 7.5 Tags

- Selecting a tag shows tasks with that tag
- Tag management: rename, color, merge tags (later)

### 7.6 Search

- Full-text search over title + notes
- Filters: status, project, tag, due range, priority
- Saved searches become Smart Lists (V1)

---

## 8. Key User Flows

### 8.1 Capture

1. User types in quick add
2. App creates task in Inbox
3. Optional parsing: detect “tomorrow 9am #work !high”

### 8.2 Triage

1. Open Inbox
2. Multi-select tasks
3. Assign project, tags, due/start
4. Clear inbox to zero (goal)

### 8.3 Complete + Recurrence

1. User completes a recurring task
2. System marks current instance completed
3. System generates next instance per recurrence rule
4. Next instance appears at correct date/time

### 8.4 Offline Work + Sync

1. User edits tasks offline
2. Local changes stored in “outbox”
3. When online:
   - push changes
   - pull remote changes
   - resolve conflicts
4. UI shows sync status and errors

---

## 9. Functional Requirements (Detailed)

### 9.1 Task CRUD

- Create, edit, delete, cancel, complete, uncomplete
- Validation:
  - title required, trim whitespace
  - dueAt >= startAt (if both set)
- Soft delete recommended (tombstone) for sync reliability

### 9.2 Subtasks / Checklist (MVP optional, V1 required)

- Subtasks are ordered items under a task
- Each item: `id`, `text`, `done`, `order`
- Completing parent task does not automatically complete subtasks unless user chooses “complete all”

### 9.3 Priorities

- Provide 4 levels or numeric ranking
- Sorting behavior:
  - Today: overdue > due soon > priority
  - Project lists: configurable sorting (later)

### 9.4 Recurrence

**MVP:** daily/weekly/monthly with interval

- Examples:
  - Every day
  - Every week on Mon/Wed/Fri
  - Every month on day 15

**V1:** support more rules:

- “last weekday of month”
- “every 2 weeks on Tuesday”
- “every weekday”

Behavior:

- Recurring task can be based on due date or completion date (configurable):
  - `mode = fixedSchedule | fromCompletion`

### 9.5 Reminders / Notifications

- Supported channels:
  - Push notifications (mobile/web)
  - Email reminders (optional later)
- Reminders trigger at `remindAt` based on user timezone
- Handling:
  - If device offline, reminder should still fire if possible (mobile local notifications)
  - If server-driven, ensure dedupe and delivery retries

### 9.6 Templates (V1)

- User can create template sets:
  - “Morning routine”
  - “Trip packing list”
- Instantiation creates tasks in chosen project/inbox with relative dates optional

### 9.7 Smart Lists (V1)

- Users define filter rules:
  - Status, tags, project, due ranges, priority, text contains
- Saved smart lists appear in sidebar

### 9.8 Collaboration (V2)

- Shared project membership
- Roles:
  - Owner, Editor, Viewer
- Task assignment to workspace members
- Comments with mentions
- Activity feed per project/task
- Permission enforcement at API + UI

### 9.9 Automations (V2)

Examples:

- If tagged `waiting`, auto-snooze 3 days
- On task completion, create follow-up task
- On due date missed, increase priority

Implementation:

- Rules engine that subscribes to domain events (taskCreated, taskCompleted, dueDateChanged)

### 9.10 Analytics (V2)

- Completion trends over time
- Most postponed tasks
- Estimates vs actual (if time tracking added)
- Privacy-safe aggregation

---

## 10. Non-Functional Requirements

### 10.1 Performance

- Task list interactions: <100ms perceived latency (local)
- Search: results <300ms for typical dataset (10k tasks)
- Sync: incremental; avoid full refresh

### 10.2 Reliability

- Offline-first must be robust:
  - No data loss on crash
  - Outbox persisted
- Sync must handle intermittent connectivity

### 10.3 Security & Privacy

- Encrypt traffic (TLS)
- Store minimal PII
- Data export + delete account
- Principle of least privilege for internal services
- Audit logs in V2 for team actions

### 10.4 Accessibility

- Keyboard navigation
- Screen reader compatibility
- Contrast compliance
- Focus indicators for key actions

### 10.5 Internationalization

- i18n for UI strings
- Date/time formatting by locale
- Timezone handling correct and tested

---

## 11. Sync & Conflict Resolution (Offline-First)

### 11.1 Approach

Choose one:

- **Option A (recommended):** event-based sync (append-only ops)
- **Option B:** record-based sync with versioning (ETag/updatedAt + conflict resolution)

**Acceptance criteria:** must support multi-device edits without silent loss.

### 11.2 Data Storage

- Local DB (SQLite on mobile; IndexedDB on web) or unified abstraction
- Server DB (Postgres recommended)

### 11.3 Conflict Strategy

Define deterministic policy:

- Field-level merge where safe (e.g., tags union)
- Last-write-wins for scalar fields (title, dueAt) **with conflict surfacing** if both changed since last sync
- Keep “conflicted” copy if required (advanced)

### 11.4 Sync Error Handling

- Retries with backoff
- “Sync paused” UI if auth expired
- Diagnostics screen: last sync time, pending ops count, error details

---

## 12. Search Specification

### 12.1 Requirements

- Full-text search for title + notes
- Filters: project, tags, status, due range, priority
- Sort by relevance then due date

### 12.2 Implementation Notes

- MVP: server-side search + cached local results OR local search for offline
- V1: add search index (FTS) locally and/or server-side (Postgres FTS)

---

## 13. API Specification (High-Level)

### 13.1 Authentication

- Email/password or OAuth (TBD)
- Token-based auth (JWT/access token) with refresh strategy

### 13.2 Core Endpoints (illustrative)

- `POST /tasks`
- `GET /tasks?filters...`
- `PATCH /tasks/:id`
- `DELETE /tasks/:id` (soft delete)
- `POST /tasks/:id/complete`
- `POST /tasks/:id/uncomplete`
- `GET /projects`, `POST /projects`, `PATCH /projects/:id`
- `GET /tags`, `POST /tags`, `PATCH /tags/:id`

### 13.3 Sync Endpoints

Pick one:

- Ops-based:
  - `POST /sync/push` (client sends ops since cursor)
  - `GET /sync/pull?cursor=...`
- Record-based:
  - `POST /sync` with client changes + lastSeenVersion

### 13.4 Error Contract

- Consistent error codes:
  - `VALIDATION_ERROR`, `NOT_FOUND`, `FORBIDDEN`, `CONFLICT`, `RATE_LIMITED`
- Include machine-readable `code` + human message

---

## 14. Observability & Telemetry

### 14.1 Logging

- Server logs structured with requestId
- Client logs (optional) for sync debugging, privacy-safe

### 14.2 Metrics

- Sync success rate
- Time to first interactive
- Search latency
- Notification delivery success

### 14.3 Tracing (optional)

- Distributed tracing for sync endpoints

---

## 15. Testing Strategy

### 15.1 Unit Tests

- Task rules: due/start validation
- Recurrence generation
- Conflict merge logic
- Smart list rule evaluation

### 15.2 Integration Tests

- Sync push/pull with simulated offline
- Notification scheduling/delivery
- Search + filters

### 15.3 End-to-End Tests

- Critical user journeys:
  - Capture → triage → Today → complete → recurrence creates next
  - Offline edits → online sync → multi-device conflict

### 15.4 Property/Chaos Tests (recommended)

- Randomized sequences of edits across devices to prove “no data loss”

---

## 16. Acceptance Criteria (Launch)

### 16.1 MVP Acceptance

- User can create/organize tasks and use Today/Upcoming views.
- Offline edits persist and sync correctly after reconnect.
- Reminders fire for due tasks (at least one supported platform).
- Recurring tasks generate next instance reliably.
- Search works with reasonable performance.

### 16.2 Quality Gates

- No known data-loss bugs
- Crash-free rate threshold (define)
- Sync success rate threshold (define)
- Basic accessibility checks pass

---

## 17. Risks & Mitigations

### 17.1 Offline + Sync Complexity

- Mitigation: limit model complexity in MVP; keep deterministic merge rules; add strong tests.

### 17.2 Timezone Bugs

- Mitigation: store timestamps in UTC + store user timezone preference; exhaustive tests around DST boundaries.

### 17.3 Recurrence Edge Cases

- Mitigation: implement a recurrence library or well-tested rules module; document behavior clearly.

---

## 18. Open Decisions (Must Resolve Early)

- Platform choice: Native mobile vs PWA
- Sync model: ops-based vs record-based
- Auth method
- Notification delivery: device-local vs server-driven
- Search: local-first, server-first, hybrid
- Collaboration timeline (V2 only or partial earlier)

---

## 19. Appendix: Suggested Architecture (Brief)

- **Functional core / imperative shell**:
  - Core: pure “decide” functions (commands → events), recurrence generation, merges
  - Shell: UI, DB adapters, network sync, notifications
- Domain events make:
  - undo/redo
  - audit logs
  - automations
  - sync ops
    much easier later.

---

## 20. Glossary

- **Inbox:** unprocessed tasks
- **Start date:** task hidden until date
- **Due date:** deadline / when it must be done
- **Recurring task:** task that repeats based on rule
- **Smart list:** saved filter-based view
- **Outbox:** queued offline changes awaiting sync
