import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiRequestError, type TagDTO } from "@/lib/api-client";
import { useAuth } from "@/context/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tags, Plus, Pencil, Trash2, Check, X, Hash } from "lucide-react";

export function TagListPage() {
  const { logout } = useAuth();
  const [tags, setTags] = useState<TagDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#8b5cf6");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  const fetchTags = useCallback(async () => {
    try {
      setError(null);
      const data = await api.getTags();
      setTags(data);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        void logout();
        return;
      }
      setError("Failed to load tags");
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    void fetchTags();
  }, [fetchTags]);

  const handleApiError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiRequestError && err.status === 401) void logout();
    },
    [logout],
  );

  const handleCreate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed || creating) return;
    setCreating(true);
    try {
      const created = await api.createTag({ name: trimmed, color: newColor });
      setTags((prev) => [...prev, created]);
      setNewName("");
    } catch (err) {
      handleApiError(err);
    } finally {
      setCreating(false);
    }
  }, [newName, newColor, creating, handleApiError]);

  const startEdit = useCallback((tag: TagDTO) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color ?? "#8b5cf6");
  }, []);

  const commitEdit = useCallback(async () => {
    if (!editingId) return;
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }
    try {
      const updated = await api.updateTag(editingId, { name: trimmed, color: editColor });
      setTags((prev) => prev.map((t) => (t.id === editingId ? updated : t)));
    } catch (err) {
      handleApiError(err);
    }
    setEditingId(null);
  }, [editingId, editName, editColor, handleApiError]);

  const handleDelete = useCallback(async (tagId: string) => {
    try {
      await api.deleteTag(tagId);
      setTags((prev) => prev.filter((t) => t.id !== tagId));
    } catch (err) {
      handleApiError(err);
    }
  }, [handleApiError]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Tags className="h-6 w-6" />
          Tags
        </h1>
      </div>

      <form onSubmit={handleCreate} className="flex items-center gap-2 mb-6">
        <input
          type="color"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
          className="h-9 w-9 rounded border cursor-pointer shrink-0"
        />
        <Input
          placeholder="New tag name..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          disabled={creating}
          className="flex-1"
        />
        <Button type="submit" size="icon" variant="ghost" disabled={!newName.trim() || creating}>
          <Plus className="h-5 w-5" />
        </Button>
      </form>

      {loading && <p className="text-muted-foreground">Loading...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && tags.length === 0 && (
        <p className="text-muted-foreground text-center py-8">No tags yet. Create one above!</p>
      )}

      <div className="flex flex-col gap-2">
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="group flex items-center gap-3 rounded-md border px-4 py-3 hover:bg-accent/50 transition-colors"
          >
            {editingId === tag.id ? (
              <>
                <input
                  type="color"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="h-6 w-6 rounded cursor-pointer shrink-0"
                />
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void commitEdit();
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="h-auto py-0 px-0 border-0 shadow-none focus-visible:ring-0 text-sm flex-1"
                  autoFocus
                />
                <button onClick={() => void commitEdit()} className="text-muted-foreground hover:text-foreground cursor-pointer">
                  <Check className="h-4 w-4" />
                </button>
                <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Hash
                  className="h-4 w-4 shrink-0"
                  style={{ color: tag.color ?? undefined }}
                />
                <Link
                  to={`/tags/${tag.id}`}
                  className="flex-1 min-w-0 truncate text-sm font-medium hover:underline"
                >
                  {tag.name}
                </Link>
                <div className="shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(tag)} className="text-muted-foreground hover:text-foreground cursor-pointer" aria-label="Edit tag">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => void handleDelete(tag.id)} className="text-muted-foreground hover:text-destructive cursor-pointer" aria-label="Delete tag">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
