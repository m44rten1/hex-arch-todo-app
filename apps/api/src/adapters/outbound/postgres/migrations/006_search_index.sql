ALTER TABLE tasks
  ADD COLUMN search_vec tsvector
    GENERATED ALWAYS AS (
      to_tsvector('english', coalesce(title, '') || ' ' || coalesce(notes, ''))
    ) STORED;

CREATE INDEX idx_tasks_search ON tasks USING GIN (search_vec);
