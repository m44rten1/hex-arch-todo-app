CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL
);

CREATE TABLE workspaces (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  owner_user_id TEXT NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_workspaces_owner ON workspaces (owner_user_id);

ALTER TABLE projects ADD CONSTRAINT fk_projects_workspace
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id);

ALTER TABLE tasks ADD CONSTRAINT fk_tasks_workspace
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id);
