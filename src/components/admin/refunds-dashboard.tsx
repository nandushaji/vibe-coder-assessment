"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Download, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  exportRefundRowsForCsv,
  updateRefundReviewStatus,
} from "@/app/actions/admin-refunds";
import {
  REFUND_CSV_EXPORT_LIMIT,
  type RefundAdminRow,
  type RefundReviewStatus,
} from "@/lib/admin/refund-admin";
import type { RefundDashboardStatusFilter } from "@/lib/admin/refunds-dashboard-params";
import { REFUNDS_DEFAULT_PAGE_SIZE } from "@/lib/admin/refunds-dashboard-params";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefundsTableSkeleton } from "@/components/admin/refunds-dashboard-skeleton";

/** Fixed locale so server HTML matches client hydration (undefined uses OS/browser defaults). */
const DISPLAY_LOCALE = "en-US";

function reviewStatusLabel(s: RefundReviewStatus): string {
  switch (s) {
    case "pending":
      return "Pending";
    case "accepted":
      return "Accepted";
    case "rejected":
      return "Rejected";
    default:
      return s;
  }
}

function ReviewStatusBadge({ status }: { status: RefundReviewStatus }) {
  const styles: Record<RefundReviewStatus, string> = {
    pending:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100",
    accepted:
      "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-100",
    rejected:
      "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-100",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles[status],
      )}
    >
      {reviewStatusLabel(status)}
    </span>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(DISPLAY_LOCALE, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(DISPLAY_LOCALE, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildCsv(rows: RefundAdminRow[]): string {
  const headers = [
    "id",
    "full_name",
    "email",
    "booking_reference",
    "booking_date",
    "refund_reason",
    "additional_details",
    "file_url",
    "review_status",
    "created_at",
  ];
  const escape = (value: string) => {
    const v = value.replace(/"/g, '""');
    return `"${v}"`;
  };
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      [
        row.id,
        row.full_name,
        row.email,
        row.booking_reference,
        row.booking_date,
        row.refund_reason,
        row.additional_details ?? "",
        row.file_url ?? "",
        row.review_status,
        row.created_at,
      ]
        .map((cell) => escape(String(cell)))
        .join(","),
    ),
  ];
  return lines.join("\n");
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

type RefundDashboardStatsProps = {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
};

export function RefundsDashboard({
  rows,
  stats,
  totalFiltered,
  page,
  pageSize,
  initialQuery,
  initialStatus,
  isTableLoading = false,
}: {
  rows: RefundAdminRow[];
  stats: RefundDashboardStatsProps;
  totalFiltered: number;
  page: number;
  pageSize: number;
  initialQuery: string;
  initialStatus: RefundDashboardStatusFilter;
  /** Skeleton in the table / mobile list / pagination area only. */
  isTableLoading?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [exportPending, startExportTransition] = useTransition();
  const [inputQ, setInputQ] = useState(initialQuery);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<RefundAdminRow | null>(null);

  const safeRows = Array.isArray(rows) ? rows : [];
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const rangeStart =
    totalFiltered === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalFiltered);

  useEffect(() => {
    setInputQ(initialQuery);
  }, [initialQuery]);

  const buildHref = useCallback(
    (overrides: {
      page?: number;
      pageSize?: number;
      q?: string;
      status?: RefundDashboardStatusFilter;
    }) => {
      const p = new URLSearchParams();
      const nextPage = overrides.page ?? page;
      const nextSize = overrides.pageSize ?? pageSize;
      const nextQ =
        overrides.q !== undefined ? overrides.q : inputQ;
      const nextSt = overrides.status ?? initialStatus;
      if (nextPage > 1) p.set("page", String(nextPage));
      if (nextSize !== REFUNDS_DEFAULT_PAGE_SIZE) {
        p.set("pageSize", String(nextSize));
      }
      const qt = nextQ.trim();
      if (qt) p.set("q", qt);
      if (nextSt !== "all") p.set("status", nextSt);
      const s = p.toString();
      return s ? `${pathname}?${s}` : pathname;
    },
    [page, pageSize, inputQ, initialStatus, pathname],
  );

  useEffect(() => {
    if (inputQ.trim() === initialQuery.trim()) return;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      searchDebounceRef.current = null;
      router.push(buildHref({ page: 1, q: inputQ }));
    }, 380);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [inputQ, initialQuery, buildHref, router]);

  function openDetail(row: RefundAdminRow) {
    setSelected(row);
    setDetailOpen(true);
  }

  function closeDetail() {
    setDetailOpen(false);
    setSelected(null);
  }

  function setReviewStatus(id: string, status: RefundReviewStatus) {
    startTransition(async () => {
      const result = await updateRefundReviewStatus(id, status);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(
        status === "accepted"
          ? "Refund marked as accepted."
          : status === "rejected"
            ? "Refund marked as rejected."
            : "Refund set back to pending.",
      );
      setSelected((prev) =>
        prev && prev.id === id ? { ...prev, review_status: status } : prev,
      );
      router.refresh();
    });
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-5 px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 sm:space-y-6 sm:px-6 sm:pt-6">
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-sm sm:p-4">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">
            Total requests
          </p>
          <p className="mt-1.5 text-2xl font-semibold sm:mt-2 sm:text-3xl">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-sm sm:p-4">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">
            Pending review
          </p>
          <p className="mt-1.5 text-2xl font-semibold text-amber-700 dark:text-amber-400 sm:mt-2 sm:text-3xl">
            {stats.pending}
          </p>
        </div>
        <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-sm sm:p-4">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">
            Accepted
          </p>
          <p className="mt-1.5 text-2xl font-semibold text-emerald-700 dark:text-emerald-400 sm:mt-2 sm:text-3xl">
            {stats.accepted}
          </p>
        </div>
        <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-sm sm:p-4">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">
            Rejected
          </p>
          <p className="mt-1.5 text-2xl font-semibold text-rose-700 dark:text-rose-400 sm:mt-2 sm:text-3xl">
            {stats.rejected}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Input
          value={inputQ}
          onChange={(e) => setInputQ(e.target.value)}
          placeholder="Search name, email, ref, reason…"
          className="h-11 w-full md:max-w-md"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {(
              [
                ["all", "All"],
                ["pending", "Pending"],
                ["accepted", "Accepted"],
                ["rejected", "Rejected"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => router.push(buildHref({ page: 1, status: value }))}
                className={cn(
                  "min-h-9 touch-manipulation rounded-full border px-3 py-1.5 text-xs font-semibold transition active:scale-[0.98]",
                  initialStatus === value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/70 bg-muted/40 text-muted-foreground hover:bg-muted",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full shrink-0 gap-2 touch-manipulation sm:h-9 sm:w-auto"
            disabled={exportPending}
            onClick={() =>
              startExportTransition(async () => {
                const result = await exportRefundRowsForCsv(
                  inputQ,
                  initialStatus,
                );
                if (!result.success) {
                  toast.error(result.error);
                  return;
                }
                downloadCsv(
                  `refund-requests-${new Date().toISOString().slice(0, 10)}.csv`,
                  buildCsv(result.rows),
                );
                if (result.rows.length >= REFUND_CSV_EXPORT_LIMIT) {
                  toast.message("Export limited", {
                    description: `Only the first ${REFUND_CSV_EXPORT_LIMIT.toLocaleString()} matching rows were exported.`,
                  });
                }
              })
            }
          >
            {exportPending ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
            ) : (
              <Download className="h-4 w-4 shrink-0" aria-hidden />
            )}
            Export CSV
          </Button>
        </div>
      </div>

      {isTableLoading ? (
        <RefundsTableSkeleton />
      ) : safeRows.length === 0 ? (
        <div className="rounded-2xl border border-border/80 bg-card py-12 text-center text-sm text-muted-foreground shadow-sm">
          No refund requests match your filters.
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {safeRows.map((row) => (
              <article
                key={row.id}
                className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-snug">{row.full_name}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{row.email}</p>
                  </div>
                  <ReviewStatusBadge status={row.review_status} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                      Booking
                    </p>
                    <p className="mt-0.5 truncate font-mono text-xs">{row.booking_reference}</p>
                    <p className="truncate text-xs text-muted-foreground">{row.booking_date}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                      Submitted
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDateShort(row.created_at)}
                    </p>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {row.refund_reason}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 h-11 w-full touch-manipulation sm:h-9"
                  onClick={() => openDetail(row)}
                >
                  View details
                </Button>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-2xl border border-border/80 bg-card shadow-sm md:block">
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Guest</TableHead>
                  <TableHead>Booking</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="font-semibold">{row.full_name}</div>
                      <div className="text-xs text-muted-foreground">{row.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm">{row.booking_reference}</div>
                      <div className="text-xs text-muted-foreground">{row.booking_date}</div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm">{row.refund_reason}</TableCell>
                    <TableCell>
                      <ReviewStatusBadge status={row.review_status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(row.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="touch-manipulation"
                        onClick={() => openDetail(row)}
                      >
                        View details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalFiltered > 0 ? (
            <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-center text-sm text-muted-foreground sm:text-left">
                Showing{" "}
                <span className="font-medium text-foreground">
                  {rangeStart}–{rangeEnd}
                </span>{" "}
                of{" "}
                <span className="font-medium text-foreground">
                  {totalFiltered}
                </span>
              </p>
              {totalPages > 1 ? (
                <div className="flex items-center justify-center gap-2 sm:justify-end">
                  <Link
                    href={buildHref({ page: page - 1 })}
                    scroll={false}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "min-w-[5.5rem] justify-center",
                      page <= 1 && "pointer-events-none opacity-40",
                    )}
                    onClick={(e) => {
                      if (page <= 1) e.preventDefault();
                    }}
                  >
                    Previous
                  </Link>
                  <span className="min-w-[6rem] text-center text-sm tabular-nums text-muted-foreground">
                    Page {page} / {totalPages}
                  </span>
                  <Link
                    href={buildHref({ page: page + 1 })}
                    scroll={false}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "min-w-[5.5rem] justify-center",
                      page >= totalPages && "pointer-events-none opacity-40",
                    )}
                    onClick={(e) => {
                      if (page >= totalPages) e.preventDefault();
                    }}
                  >
                    Next
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      )}

      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          if (!open) closeDetail();
          else setDetailOpen(true);
        }}
      >
        <DialogContent className="flex max-h-[min(100dvh-1rem,720px)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-h-[min(90dvh,720px)] sm:max-w-lg">
          <DialogHeader className="shrink-0 space-y-2 border-b border-border/80 px-4 py-4 pr-12 text-left sm:px-6 sm:pr-14">
            <DialogTitle className="text-[0.9375rem] leading-snug sm:text-base">
              Refund request
            </DialogTitle>
            {selected ? (
              <>
                <DialogDescription className="sr-only">
                  {selected.full_name}, {reviewStatusLabel(selected.review_status)}
                </DialogDescription>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-foreground">{selected.full_name}</span>
                  <span className="text-muted-foreground">·</span>
                  <ReviewStatusBadge status={selected.review_status} />
                </div>
              </>
            ) : null}
          </DialogHeader>

          {selected ? (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
                <dl className="grid gap-4 text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Email
                    </dt>
                    <dd className="mt-1 break-all">{selected.email}</dd>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Booking reference
                      </dt>
                      <dd className="mt-1 font-mono text-sm">{selected.booking_reference}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Booking date
                      </dt>
                      <dd className="mt-1">{selected.booking_date}</dd>
                    </div>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Reason
                    </dt>
                    <dd className="mt-1 whitespace-pre-wrap">{selected.refund_reason}</dd>
                  </div>
                  {selected.additional_details ? (
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Additional details
                      </dt>
                      <dd className="mt-1 whitespace-pre-wrap text-muted-foreground">
                        {selected.additional_details}
                      </dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Submitted
                    </dt>
                    <dd className="mt-1 text-muted-foreground">{formatDate(selected.created_at)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Attachment
                    </dt>
                    <dd className="mt-1">
                      {selected.file_url ? (
                        <a
                          href={selected.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
                        >
                          Open file
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">No file uploaded</span>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="shrink-0 border-t border-border/80 bg-muted/20 px-4 py-4 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    {selected.review_status !== "pending" ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-11 w-full touch-manipulation sm:h-9 sm:w-auto"
                        disabled={isPending}
                        onClick={() => setReviewStatus(selected.id, "pending")}
                      >
                        Reopen (pending)
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-11 w-full touch-manipulation sm:h-9 sm:w-auto"
                      onClick={closeDetail}
                    >
                      Close
                    </Button>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                    {selected.review_status === "pending" ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 w-full touch-manipulation border-rose-300 text-rose-700 hover:bg-rose-50 sm:h-9 sm:w-auto sm:min-w-[7.5rem] dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/50"
                          disabled={isPending}
                          onClick={() => setReviewStatus(selected.id, "rejected")}
                        >
                          {isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                          ) : null}
                          Reject
                        </Button>
                        <Button
                          type="button"
                          className="h-11 w-full touch-manipulation sm:h-9 sm:w-auto sm:min-w-[7.5rem]"
                          disabled={isPending}
                          onClick={() => setReviewStatus(selected.id, "accepted")}
                        >
                          {isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                          ) : null}
                          Accept
                        </Button>
                      </>
                    ) : (
                      <p className="text-center text-xs text-muted-foreground sm:text-right">
                        Decision recorded. Use Reopen to send this request back to pending review.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
