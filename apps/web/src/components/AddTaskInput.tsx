import { type FormEvent, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AddTaskInputProps {
  onAdd: (title: string) => Promise<void>;
}

export function AddTaskInput({ onAdd }: AddTaskInputProps) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      await onAdd(trimmed);
      setValue("");
      inputRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        ref={inputRef}
        placeholder="Add a task..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={submitting}
        className="flex-1"
      />
      <Button
        type="submit"
        size="icon"
        variant="ghost"
        disabled={!value.trim() || submitting}
        aria-label="Add task"
      >
        <Plus className="h-5 w-5" />
      </Button>
    </form>
  );
}
