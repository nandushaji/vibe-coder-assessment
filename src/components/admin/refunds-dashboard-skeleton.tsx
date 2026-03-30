import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton for the refunds data table, mobile cards, and pagination bar only. */
export function RefundsTableSkeleton() {
  return (
    <div
      className="space-y-3"
      aria-busy="true"
      aria-label="Loading refund requests"
    >
      <div className="hidden overflow-x-auto rounded-2xl border border-border/80 bg-card shadow-sm md:block">
        <div className="min-w-[720px] p-4">
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
              <Skeleton className="h-10 w-[18%]" />
              <Skeleton className="h-10 w-[16%]" />
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-10 w-[14%]" />
              <Skeleton className="h-9 w-28 shrink-0" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-3 md:hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm"
          >
            <div className="flex justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4 max-w-[12rem]" />
                <Skeleton className="h-3 w-full max-w-[14rem]" />
              </div>
              <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
            </div>
            <Skeleton className="mt-4 h-16 w-full" />
            <Skeleton className="mt-4 h-11 w-full" />
          </div>
        ))}
      </div>
      <div className="flex justify-center border-t border-border/60 pt-4">
        <Skeleton className="h-9 w-64 max-w-full" />
      </div>
    </div>
  );
}

/** @deprecated Prefer RefundsTableSkeleton; kept for rare full-page fallback. */
export function RefundsDashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-5 px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 sm:space-y-6 sm:px-6 sm:pt-6">
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/80 bg-card p-3 shadow-sm sm:p-4"
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-8 w-16 sm:h-9 sm:w-20" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-11 w-full md:max-w-md" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-20 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-11 w-full sm:h-9 sm:w-[8.5rem]" />
        </div>
      </div>
      <RefundsTableSkeleton />
    </div>
  );
}
