CREATE TABLE recurrence_rules (
  id TEXT PRIMARY KEY,
  frequency TEXT NOT NULL,
  interval INTEGER NOT NULL DEFAULT 1,
  days_of_week TEXT,
  day_of_month INTEGER,
  mode TEXT NOT NULL DEFAULT 'fixedSchedule',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE tasks ADD COLUMN recurrence_rule_id TEXT REFERENCES recurrence_rules(id);
