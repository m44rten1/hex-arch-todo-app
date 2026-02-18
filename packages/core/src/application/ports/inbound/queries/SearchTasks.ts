export interface SearchTasksQuery {
  readonly type: "SearchTasks";
  readonly q: string;
  readonly projectId?: string;
  readonly tagIds?: readonly string[];
  readonly status?: string;
  readonly dueBefore?: string;
  readonly dueAfter?: string;
}
