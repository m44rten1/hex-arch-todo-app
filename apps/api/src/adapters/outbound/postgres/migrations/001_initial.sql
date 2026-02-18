CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE projects (
  id          TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  name        TEXT NOT NULL,
  color       TEXT,
  archived    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_projects_workspace ON projects (workspace_id);

CREATE TABLE tasks (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'active',
  notes         TEXT,
  project_id    TEXT REFERENCES projects(id) ON DELETE SET NULL,
  due_at        TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL,
  owner_user_id TEXT NOT NULL,
  workspace_id  TEXT NOT NULL
);

CREATE INDEX idx_tasks_workspace_status ON tasks (workspace_id, status);
CREATE INDEX idx_tasks_project ON tasks (project_id);
CREATE INDEX idx_tasks_due ON tasks (workspace_id, due_at) WHERE status = 'active';
CREATE INDEX idx_tasks_inbox ON tasks (workspace_id) WHERE project_id IS NULL AND status = 'active';
