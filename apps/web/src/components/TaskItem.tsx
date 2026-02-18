import { Circle, CheckCircle2 } from "lucide-react";
import type { TaskDTO } from "@/lib/api-client";

interface TaskItemProps {
  task: TaskDTO;
  onComplete: (taskId: string) => void;
}

export function TaskItem({ task, onComplete }: TaskItemProps) {
  const isCompleted = task.status === "completed";

  return (
    <div className="flex items-center gap-3 rounded-md border px-4 py-3">
      <button
        type="button"
        onClick={() => !isCompleted && onComplete(task.id)}
        className="shrink-0 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        disabled={isCompleted}
        aria-label={isCompleted ? "Completed" : "Complete task"}
      >
        {isCompleted ? (
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>
      <span className={isCompleted ? "line-through text-muted-foreground" : ""}>
        {task.title}
      </span>
    </div>
  );
}
