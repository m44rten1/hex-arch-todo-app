import {
  type KeyboardEvent,
  useRef,
  useState,
} from "react";
import { Circle, CheckCircle2, Trash2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { TaskDTO } from "@/lib/api-client";

interface TaskItemProps {
  task: TaskDTO;
  onToggleComplete: (taskId: string, currentlyCompleted: boolean) => Promise<void>;
  onUpdate: (taskId: string, title: string) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}

export function TaskItem({ task, onToggleComplete, onUpdate, onDelete }: TaskItemProps) {
  const isCompleted = task.status === "completed";
  const [toggling, setToggling] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleToggle() {
    if (toggling) return;
    setToggling(true);
    try {
      await onToggleComplete(task.id, isCompleted);
    } finally {
      setToggling(false);
    }
  }

  function startEditing() {
    if (isCompleted) return;
    setEditValue(task.title);
    setEditing(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  async function commitEdit() {
    setEditing(false);
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== task.title) {
      await onUpdate(task.id, trimmed);
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      void commitEdit();
    } else if (e.key === "Escape") {
      setEditing(false);
      setEditValue(task.title);
    }
  }

  return (
    <div className="group flex items-center gap-3 rounded-md border px-4 py-3 hover:bg-accent/50 transition-colors">
      <button
        type="button"
        onClick={handleToggle}
        className="shrink-0 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        disabled={toggling}
        aria-label={isCompleted ? "Uncomplete task" : "Complete task"}
      >
        {toggling ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isCompleted ? (
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        {editing ? (
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => void commitEdit()}
            onKeyDown={handleKeyDown}
            className="h-auto py-0 px-0 border-0 shadow-none focus-visible:ring-0 text-sm"
          />
        ) : (
          <span
            onClick={startEditing}
            className={`block truncate ${
              isCompleted
                ? "line-through text-muted-foreground"
                : "cursor-text"
            }`}
          >
            {task.title}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => void onDelete(task.id)}
        className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all cursor-pointer"
        aria-label="Delete task"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
