import { CalendarRange } from "lucide-react";

export function UpcomingPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold flex items-center gap-2 mb-6">
        <CalendarRange className="h-6 w-6" />
        Upcoming
      </h1>
      <p className="text-muted-foreground">Coming soon</p>
    </div>
  );
}
