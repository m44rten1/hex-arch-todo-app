import type { Generated } from "kysely";

export interface UsersTable {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface WorkspacesTable {
  id: string;
  name: string;
  owner_user_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface ProjectsTable {
  id: string;
  workspace_id: string;
  name: string;
  color: string | null;
  archived: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TasksTable {
  id: string;
  title: string;
  status: string;
  notes: string | null;
  project_id: string | null;
  due_at: Date | null;
  completed_at: Date | null;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
  recurrence_rule_id: string | null;
  owner_user_id: string;
  workspace_id: string;
}

export interface TagsTable {
  id: string;
  workspace_id: string;
  name: string;
  color: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface TaskTagsTable {
  task_id: string;
  tag_id: string;
}

export interface RemindersTable {
  id: string;
  task_id: string;
  workspace_id: string;
  remind_at: Date;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface RecurrenceRulesTable {
  id: string;
  frequency: string;
  interval: number;
  days_of_week: string | null;
  day_of_month: number | null;
  mode: string;
  created_at: Date;
  updated_at: Date;
}

export interface MigrationsTable {
  name: string;
  applied_at: Generated<Date>;
}

export interface Database {
  users: UsersTable;
  workspaces: WorkspacesTable;
  projects: ProjectsTable;
  tasks: TasksTable;
  tags: TagsTable;
  task_tags: TaskTagsTable;
  reminders: RemindersTable;
  recurrence_rules: RecurrenceRulesTable;
  _migrations: MigrationsTable;
}
