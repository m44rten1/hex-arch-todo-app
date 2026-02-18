import { FolderOpen } from "lucide-react";

export function ProjectDetailPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold flex items-center gap-2 mb-6">
        <FolderOpen className="h-6 w-6" />
        Project
      </h1>
      <p className="text-muted-foreground">Coming soon</p>
    </div>
  );
}
