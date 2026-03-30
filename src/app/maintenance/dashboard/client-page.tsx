"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { ExternalLink, ImageIcon } from "lucide-react";
import { updateTicketStatus } from "@/app/actions/maintenance";
import {
  MAINTENANCE_DEFAULT_PAGE_SIZE,
  type MaintenanceTicketRow,
} from "@/lib/maintenance/maintenance-dashboard-params";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldGroup } from "@/components/field-group";
import { PageHeader } from "@/components/page-header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { MaintenanceTableSkeleton } from "@/components/maintenance/maintenance-dashboard-skeleton";

type Ticket = MaintenanceTicketRow;

function cloneTickets(rows: MaintenanceTicketRow[]): Ticket[] {
  return rows.map((r) => ({ ...r }));
}

export default function DashboardClient({
  initialTickets,
  totalCount,
  page,
  pageSize,
  initialPropertyFilter,
  initialUrgency,
  isTableLoading = false,
}: {
  initialTickets: MaintenanceTicketRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  initialPropertyFilter: string;
  initialUrgency: string;
  isTableLoading?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [tickets, setTickets] = useState<Ticket[]>(() =>
    cloneTickets(initialTickets),
  );
  const [propertyInput, setPropertyInput] = useState(initialPropertyFilter);
  const propertyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalCount);

  useEffect(() => {
    setTickets(cloneTickets(initialTickets));
  }, [initialTickets]);

  useEffect(() => {
    setPropertyInput(initialPropertyFilter);
  }, [initialPropertyFilter]);

  const buildHref = useCallback(
    (overrides: {
      page?: number;
      pageSize?: number;
      property?: string;
      urgency?: string;
    }) => {
      const p = new URLSearchParams();
      const nextPage = overrides.page ?? page;
      const nextSize = overrides.pageSize ?? pageSize;
      const nextProp =
        overrides.property !== undefined ? overrides.property : propertyInput;
      const nextUrg = overrides.urgency ?? initialUrgency;
      if (nextPage > 1) p.set("page", String(nextPage));
      if (nextSize !== MAINTENANCE_DEFAULT_PAGE_SIZE) {
        p.set("pageSize", String(nextSize));
      }
      const pt = nextProp.trim();
      if (pt) p.set("property", pt);
      if (nextUrg !== "All") p.set("urgency", nextUrg);
      const s = p.toString();
      return s ? `${pathname}?${s}` : pathname;
    },
    [page, pageSize, propertyInput, initialUrgency, pathname],
  );

  useEffect(() => {
    if (propertyInput.trim() === initialPropertyFilter.trim()) return;
    if (propertyDebounceRef.current) clearTimeout(propertyDebounceRef.current);
    propertyDebounceRef.current = setTimeout(() => {
      propertyDebounceRef.current = null;
      router.push(buildHref({ page: 1, property: propertyInput }));
    }, 380);
    return () => {
      if (propertyDebounceRef.current) clearTimeout(propertyDebounceRef.current);
    };
  }, [
    propertyInput,
    initialPropertyFilter,
    buildHref,
    router,
  ]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setTickets((current) =>
      current.map((t) => (t.id === id ? { ...t, status: newStatus } : t)),
    );
    setSelectedTicket((prev) =>
      prev?.id === id ? { ...prev, status: newStatus } : prev,
    );

    const result = await updateTicketStatus(id, newStatus);
    if (!result.success) {
      toast.error("Could not update status. Please try again.");
      router.refresh();
    }
  };

  const openTicketDetails = (ticket: Ticket) => {
    setSelectedTicket(ticket);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "High":
        return "bg-red-100 text-red-900 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-200";
      case "Medium":
        return "bg-amber-100 text-amber-900 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-200";
      case "Low":
        return "bg-emerald-100 text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  /** Outline chips for the detail panel (Material-style assist chips). */
  const getUrgencyChipClass = (urgency: string) => {
    switch (urgency) {
      case "High":
        return "border-red-200/90 bg-red-50/70 text-red-900 dark:border-red-900/45 dark:bg-red-950/40 dark:text-red-100";
      case "Medium":
        return "border-amber-200/90 bg-amber-50/70 text-amber-900 dark:border-amber-900/45 dark:bg-amber-950/40 dark:text-amber-100";
      case "Low":
        return "border-emerald-200/90 bg-emerald-50/70 text-emerald-900 dark:border-emerald-900/45 dark:bg-emerald-950/40 dark:text-emerald-100";
      default:
        return "border-border/90 bg-muted/40 text-muted-foreground";
    }
  };

  return (
    <div className="w-full space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader
          className="mb-0 border-0 pb-0"
          eyebrow="Operations"
          title="Issue dashboard"
          description="Select a row to view full details in a dialog. Filter by property or urgency. Status updates save immediately."
        />
        <Link
          href="/maintenance"
          className={cn(
            buttonVariants({ variant: "default", size: "lg" }),
            "shrink-0 self-start font-semibold"
          )}
        >
          Submit new issue
        </Link>
      </div>

      <Card className="rounded-2xl border border-border bg-card p-4 shadow-[var(--elevation-1)] sm:p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto] sm:items-stretch">
          <FieldGroup label="Filter by property" htmlFor="filter-property">
            <Input
              id="filter-property"
              placeholder="Search by property name…"
              value={propertyInput}
              onChange={(e) => setPropertyInput(e.target.value)}
            />
          </FieldGroup>
          <FieldGroup
            label="Filter by urgency"
            htmlFor="filter-urgency"
            className="sm:w-56"
          >
            <Select
              value={initialUrgency}
              onValueChange={(val) => {
                const next = val || "All";
                router.push(buildHref({ page: 1, urgency: next }));
              }}
            >
              <SelectTrigger id="filter-urgency" className="w-full">
                <SelectValue placeholder="All urgencies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All urgencies</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </FieldGroup>
        </div>
      </Card>

      {isTableLoading ? (
        <MaintenanceTableSkeleton />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--elevation-1)]">
          <div className="max-h-[min(70vh,720px)] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b bg-muted/30 hover:bg-muted/30">
                  <TableHead className="sticky top-0 z-10 bg-card font-semibold shadow-[inset_0_-1px_0_0_var(--border)]">
                    Ticket #
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-card font-semibold shadow-[inset_0_-1px_0_0_var(--border)]">
                    Property
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-card font-semibold shadow-[inset_0_-1px_0_0_var(--border)]">
                    Category
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-card font-semibold shadow-[inset_0_-1px_0_0_var(--border)]">
                    Urgency
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 whitespace-nowrap bg-card font-semibold shadow-[inset_0_-1px_0_0_var(--border)]">
                    Date submitted
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-card font-semibold shadow-[inset_0_-1px_0_0_var(--border)]">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-12 text-center text-muted-foreground"
                    >
                      No tickets match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  tickets.map((ticket) => (
                    <TableRow
                      key={ticket.id}
                      tabIndex={0}
                      aria-label={`View details for ${ticket.ticketNumber}`}
                      className="cursor-pointer border-border/60 transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-inset"
                      onClick={() => openTicketDetails(ticket)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openTicketDetails(ticket);
                        }
                      }}
                    >
                      <TableCell className="font-mono font-medium">
                        {ticket.ticketNumber}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate sm:max-w-xs">
                        {ticket.property}
                      </TableCell>
                      <TableCell>{ticket.category}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={getUrgencyColor(ticket.urgency)}
                        >
                          {ticket.urgency}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {format(new Date(ticket.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell
                        className="relative z-10"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <Select
                          value={ticket.status}
                          onValueChange={(val) => {
                            if (val) handleStatusChange(ticket.id, val);
                          }}
                        >
                          <SelectTrigger className="h-9 w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Open">Open</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Resolved">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {totalCount > 0 ? (
            <div className="flex flex-col gap-3 border-t border-border/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-center text-sm text-muted-foreground sm:text-left">
                Showing{" "}
                <span className="font-medium text-foreground">
                  {rangeStart}–{rangeEnd}
                </span>{" "}
                of{" "}
                <span className="font-medium text-foreground">{totalCount}</span>
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
        </div>
      )}

      <Dialog
        open={selectedTicket !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedTicket(null);
        }}
      >
        <DialogContent className="max-h-[min(90dvh,680px)] border-border/80 p-0 sm:max-w-lg">
          {selectedTicket ? (
            <>
              <DialogHeader className="space-y-0 border-b border-border/80 bg-card px-6 pb-5 pt-6 pr-14 text-left">
                <p className="text-[0.8125rem] font-medium leading-5 text-muted-foreground">
                  Issue details
                </p>
                <DialogTitle className="mt-1 font-mono text-[1.375rem] font-normal leading-snug tracking-tight text-foreground">
                  {selectedTicket.ticketNumber}
                </DialogTitle>
                <DialogDescription className="mt-2 text-[0.8125rem] leading-5 text-muted-foreground">
                  {format(new Date(selectedTicket.createdAt), "PPP")} ·{" "}
                  {format(new Date(selectedTicket.createdAt), "p")}
                </DialogDescription>
              </DialogHeader>

              <div className="flex min-h-0 flex-1 flex-col bg-background">
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6">
                  <div className="space-y-8">
                    <section aria-label="Ticket fields">
                      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                        <div>
                          <div className="text-xs font-medium tracking-wide text-muted-foreground">
                            Property
                          </div>
                          <div className="mt-1.5 text-sm leading-snug text-foreground">
                            {selectedTicket.property}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium tracking-wide text-muted-foreground">
                            Category
                          </div>
                          <div className="mt-1.5 text-sm leading-snug text-foreground">
                            {selectedTicket.category}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium tracking-wide text-muted-foreground">
                            Urgency
                          </div>
                          <div className="mt-1.5">
                            <span
                              className={cn(
                                "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                                getUrgencyChipClass(selectedTicket.urgency)
                              )}
                            >
                              {selectedTicket.urgency}
                            </span>
                          </div>
                        </div>
                        <div className="sm:col-span-2">
                          <div className="text-xs font-medium tracking-wide text-muted-foreground">
                            Status
                          </div>
                          <div className="mt-1.5">
                            <Select
                              modal={false}
                              value={selectedTicket.status}
                              onValueChange={(val) => {
                                if (val)
                                  handleStatusChange(selectedTicket.id, val);
                              }}
                            >
                              <SelectTrigger
                                id="detail-status"
                                className="h-10 w-full max-w-xs border-border/90 data-[size=default]:h-10"
                                aria-label="Ticket status"
                              >
                                <SelectValue placeholder="Set status" />
                              </SelectTrigger>
                              <SelectContent
                                alignItemWithTrigger={false}
                                side="bottom"
                                align="start"
                                sideOffset={6}
                                className="min-w-[var(--anchor-width)]"
                              >
                                <SelectItem value="Open">Open</SelectItem>
                                <SelectItem value="In Progress">
                                  In Progress
                                </SelectItem>
                                <SelectItem value="Resolved">Resolved</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </section>

                    <div className="h-px bg-border/80" role="presentation" />

                    <section aria-label="Description">
                      <div className="text-xs font-medium tracking-wide text-muted-foreground">
                        Description
                      </div>
                      <div className="mt-2 rounded-xl border border-border/70 bg-muted/20 px-4 py-3.5 text-sm leading-relaxed text-foreground">
                        <p className="whitespace-pre-wrap">
                          {selectedTicket.description ||
                            "No description provided."}
                        </p>
                      </div>
                    </section>

                    {selectedTicket.photoUrl ? (
                      <>
                        <div className="h-px bg-border/80" role="presentation" />
                        <section
                          className="flex gap-3 rounded-xl border border-dashed border-border/80 bg-muted/15 px-4 py-3.5"
                          aria-label="Attachment"
                        >
                          <ImageIcon
                            className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                            aria-hidden
                          />
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="text-xs font-medium tracking-wide text-muted-foreground">
                              Attachment
                            </div>
                            <p className="text-sm leading-snug text-foreground">
                              A photo was submitted with this request. Open it in
                              a new tab to view or download.
                            </p>
                            <a
                              href={selectedTicket.photoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
                            >
                              Open attachment
                              <ExternalLink
                                className="size-3.5 shrink-0 opacity-80"
                                aria-hidden
                              />
                            </a>
                          </div>
                        </section>
                      </>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 justify-end border-t border-border/80 bg-muted/25 px-6 py-3">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 min-w-[4.5rem] px-4 font-medium text-primary hover:bg-primary/10"
                    onClick={() => setSelectedTicket(null)}
                  >
                    Done
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
