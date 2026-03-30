import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton for the maintenance tickets table body + footer only. */
export function MaintenanceTableSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--elevation-1)]"
      aria-busy="true"
      aria-label="Loading tickets"
    >
      <div className="max-h-[min(70vh,720px)] overflow-auto p-4">
        <div className="flex gap-4 border-b border-border/60 pb-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, r) => (
          <div
            key={r}
            className="flex gap-4 border-b border-border/40 py-3 last:border-0"
          >
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-9 w-[140px]" />
          </div>
        ))}
      </div>
      <div className="border-t border-border/80 px-4 py-4 sm:px-5">
        <Skeleton className="mx-auto h-9 w-64 max-w-full sm:mx-0" />
      </div>
    </div>
  );
}

/** @deprecated Prefer MaintenanceTableSkeleton for inline loading. */
export function MaintenanceDashboardSkeleton() {
  return (
    <div className="w-full space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-xl space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-64 max-w-full" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <Skeleton className="h-11 w-44 shrink-0 rounded-md" />
      </div>
      <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--elevation-1)] sm:p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      </div>
      <MaintenanceTableSkeleton />
    </div>
  );
}
