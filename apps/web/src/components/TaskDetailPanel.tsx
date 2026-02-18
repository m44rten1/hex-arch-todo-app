import { useCallback, useEffect, useState } from "react";
import {
  api,
  type TaskDTO,
  type ProjectDTO,
  type TagDTO,
  type ReminderDTO,
} from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  X,
  Calendar,
  FolderOpen,
  Hash,
  FileText,
  Check,
  RotateCcw,
  Ban,
  Trash2,
  Bell,
  Plus,
  CheckCheck,
} from "lucide-react";

interface TaskDetailPanelProps {
  task: TaskDTO;
  onClose: () => void;
  onTaskUpdated: (task: TaskDTO) => void;
  onTaskDeleted: (taskId: string) => void;
}

export function TaskDetailPanel({
  task,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
}: TaskDetailPanelProps) {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes ?? "");
  const [dueAt, setDueAt] = useState(task.dueAt?.slice(0, 10) ?? "");
  const [selectedProjectId, setSelectedProjectId] = useState(task.projectId ?? "");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([...task.tagIds]);
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [tags, setTags] = useState<TagDTO[]>([]);
  const [saving, setSaving] = useState(false);
  const [reminders, setReminders] = useState<ReminderDTO[]>([]);
  const [newReminderDate, setNewReminderDate] = useState("");
  const [newReminderTime, setNewReminderTime] = useState("09:00");
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);
  const [editReminderDate, setEditReminderDate] = useState("");
  const [editReminderTime, setEditReminderTime] = useState("");

  useEffect(() => {
    setTitle(task.title);
    setNotes(task.notes ?? "");
    setDueAt(task.dueAt?.slice(0, 10) ?? "");
    setSelectedProjectId(task.projectId ?? "");
    setSelectedTagIds([...task.tagIds]);
  }, [task]);

  useEffect(() => {
    void api.getProjects().then((p) => setProjects(p.filter((proj) => !proj.archived))).catch(() => {});
    void api.getTags().then(setTags).catch(() => {});
  }, []);

  useEffect(() => {
    void api.getReminders(task.id).then(setReminders).catch(() => {});
  }, [task.id]);

  const saveField = useCallback(async (data: Parameters<typeof api.updateTask>[1]) => {
    setSaving(true);
    try {
      const updated = await api.updateTask(task.id, data);
      onTaskUpdated(updated);
    } catch {
      // silently fail, keep local state
    } finally {
      setSaving(false);
    }
  }, [task.id, onTaskUpdated]);

  const handleTitleBlur = useCallback(() => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== task.title) {
      void saveField({ title: trimmed });
    }
  }, [title, task.title, saveField]);

  const handleNotesBlur = useCallback(() => {
    const newNotes = notes.trim() || null;
    if (newNotes !== task.notes) {
      void saveField({ notes: newNotes });
    }
  }, [notes, task.notes, saveField]);

  const handleDueChange = useCallback((value: string) => {
    setDueAt(value);
    const newDue = value ? new Date(value + "T00:00:00").toISOString() : null;
    void saveField({ dueAt: newDue });
  }, [saveField]);

  const handleProjectChange = useCallback((value: string) => {
    setSelectedProjectId(value);
    void saveField({ projectId: value || null });
  }, [saveField]);

  const handleTagToggle = useCallback((tagId: string) => {
    setSelectedTagIds((prev) => {
      const next = prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId];
      void saveField({ tagIds: next });
      return next;
    });
  }, [saveField]);

  const handleAddReminder = useCallback(async () => {
    if (!newReminderDate) return;
    const remindAt = new Date(`${newReminderDate}T${newReminderTime || "09:00"}`).toISOString();
    try {
      const created = await api.createReminder(task.id, remindAt);
      setReminders((prev) => [...prev, created]);
      setNewReminderDate("");
      setNewReminderTime("09:00");
    } catch {
      // ignore
    }
  }, [task.id, newReminderDate, newReminderTime]);

  const handleUpdateReminder = useCallback(async (reminderId: string) => {
    if (!editReminderDate) {
      setEditingReminderId(null);
      return;
    }
    const remindAt = new Date(`${editReminderDate}T${editReminderTime || "09:00"}`).toISOString();
    try {
      const updated = await api.updateReminder(reminderId, remindAt);
      setReminders((prev) => prev.map((r) => (r.id === reminderId ? updated : r)));
    } catch {
      // ignore
    }
    setEditingReminderId(null);
  }, [editReminderDate, editReminderTime]);

  const handleDismissReminder = useCallback(async (reminderId: string) => {
    try {
      const updated = await api.dismissReminder(reminderId);
      setReminders((prev) => prev.map((r) => (r.id === reminderId ? updated : r)));
    } catch {
      // ignore
    }
  }, []);

  const handleDeleteReminder = useCallback(async (reminderId: string) => {
    try {
      await api.deleteReminder(reminderId);
      setReminders((prev) => prev.filter((r) => r.id !== reminderId));
    } catch {
      // ignore
    }
  }, []);

  const startEditReminder = useCallback((reminder: ReminderDTO) => {
    setEditingReminderId(reminder.id);
    const dt = new Date(reminder.remindAt);
    setEditReminderDate(dt.toISOString().slice(0, 10));
    setEditReminderTime(dt.toTimeString().slice(0, 5));
  }, []);

  const handleComplete = useCallback(async () => {
    try {
      const updated = await api.completeTask(task.id);
      onTaskUpdated(updated);
    } catch {
      // ignore
    }
  }, [task.id, onTaskUpdated]);

  const handleUncomplete = useCallback(async () => {
    try {
      const updated = await api.uncompleteTask(task.id);
      onTaskUpdated(updated);
    } catch {
      // ignore
    }
  }, [task.id, onTaskUpdated]);

  const handleCancel = useCallback(async () => {
    try {
      const updated = await api.cancelTask(task.id);
      onTaskUpdated(updated);
    } catch {
      // ignore
    }
  }, [task.id, onTaskUpdated]);

  const handleDelete = useCallback(async () => {
    try {
      await api.deleteTask(task.id);
      onTaskDeleted(task.id);
      onClose();
    } catch {
      // ignore
    }
  }, [task.id, onTaskDeleted, onClose]);

  const isCompleted = task.status === "completed";
  const isCanceled = task.status === "canceled";

  return (
    <div className="w-80 border-l bg-card h-full flex flex-col shrink-0">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-sm font-semibold text-muted-foreground">Task details</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground cursor-pointer">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Title */}
        <div>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
            className="text-base font-medium"
            disabled={saving}
          />
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            isCompleted ? "bg-green-100 text-green-800" :
            isCanceled ? "bg-red-100 text-red-800" :
            "bg-blue-100 text-blue-800"
          }`}>
            {task.status}
          </span>
        </div>

        {/* Due date */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1.5">
            <Calendar className="h-4 w-4" />
            Due date
          </label>
          <input
            type="date"
            value={dueAt}
            onChange={(e) => handleDueChange(e.target.value)}
            className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
          />
        </div>

        {/* Project */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1.5">
            <FolderOpen className="h-4 w-4" />
            Project
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => handleProjectChange(e.target.value)}
            className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
          >
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1.5">
            <Hash className="h-4 w-4" />
            Tags
          </label>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => {
              const selected = selectedTagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => handleTagToggle(tag.id)}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer border ${
                    selected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "text-muted-foreground hover:bg-accent border-border"
                  }`}
                >
                  <Hash className="h-3 w-3" style={{ color: selected ? undefined : tag.color ?? undefined }} />
                  {tag.name}
                </button>
              );
            })}
            {tags.length === 0 && (
              <span className="text-xs text-muted-foreground">No tags available</span>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1.5">
            <FileText className="h-4 w-4" />
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            placeholder="Add notes..."
            rows={4}
            className="w-full rounded-md border bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Reminders */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1.5">
            <Bell className="h-4 w-4" />
            Reminders
          </label>

          {reminders.length > 0 && (
            <div className="space-y-2 mb-2">
              {reminders.map((reminder) => {
                const isPending = reminder.status === "pending";
                const dt = new Date(reminder.remindAt);

                if (editingReminderId === reminder.id) {
                  return (
                    <div key={reminder.id} className="flex gap-1 items-center">
                      <input
                        type="date"
                        value={editReminderDate}
                        onChange={(e) => setEditReminderDate(e.target.value)}
                        className="flex-1 rounded border bg-transparent px-2 py-1 text-xs"
                      />
                      <input
                        type="time"
                        value={editReminderTime}
                        onChange={(e) => setEditReminderTime(e.target.value)}
                        className="w-20 rounded border bg-transparent px-2 py-1 text-xs"
                      />
                      <button
                        onClick={() => void handleUpdateReminder(reminder.id)}
                        className="text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingReminderId(null)}
                        className="text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={reminder.id}
                    className="group/reminder flex items-center justify-between rounded border px-2 py-1.5 text-xs"
                  >
                    <span className={isPending ? "" : "text-muted-foreground line-through"}>
                      {dt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}{" "}
                      {dt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover/reminder:opacity-100 transition-opacity">
                      {isPending && (
                        <>
                          <button
                            onClick={() => startEditReminder(reminder)}
                            className="text-muted-foreground hover:text-foreground cursor-pointer"
                            aria-label="Edit reminder"
                          >
                            <Calendar className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => void handleDismissReminder(reminder.id)}
                            className="text-muted-foreground hover:text-foreground cursor-pointer"
                            aria-label="Dismiss reminder"
                          >
                            <CheckCheck className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => void handleDeleteReminder(reminder.id)}
                        className="text-muted-foreground hover:text-destructive cursor-pointer"
                        aria-label="Delete reminder"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-1 items-center">
            <input
              type="date"
              value={newReminderDate}
              onChange={(e) => setNewReminderDate(e.target.value)}
              className="flex-1 rounded border bg-transparent px-2 py-1 text-xs"
            />
            <input
              type="time"
              value={newReminderTime}
              onChange={(e) => setNewReminderTime(e.target.value)}
              className="w-20 rounded border bg-transparent px-2 py-1 text-xs"
            />
            <button
              onClick={() => void handleAddReminder()}
              disabled={!newReminderDate}
              className="text-muted-foreground hover:text-foreground disabled:opacity-40 cursor-pointer"
              aria-label="Add reminder"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t px-4 py-3 space-y-2">
        {task.status === "active" && (
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => void handleComplete()}
          >
            <Check className="h-4 w-4" />
            Complete
          </Button>
        )}
        {isCompleted && (
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => void handleUncomplete()}
          >
            <RotateCcw className="h-4 w-4" />
            Uncomplete
          </Button>
        )}
        {task.status === "active" && (
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => void handleCancel()}
          >
            <Ban className="h-4 w-4" />
            Cancel task
          </Button>
        )}
        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-destructive hover:text-destructive"
          onClick={() => void handleDelete()}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}
