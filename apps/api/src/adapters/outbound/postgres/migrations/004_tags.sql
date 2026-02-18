CREATE TABLE tags (
  id           TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  name         TEXT NOT NULL,
  color        TEXT,
  created_at   TIMESTAMPTZ NOT NULL,
  updated_at   TIMESTAMPTZ NOT NULL,
  UNIQUE (workspace_id, name)
);

CREATE INDEX idx_tags_workspace ON tags (workspace_id);
