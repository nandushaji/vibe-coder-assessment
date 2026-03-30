"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadMaintenanceDashboardData } from "@/app/actions/maintenance-dashboard-load";
import DashboardClient from "./client-page";
import {
  MAINTENANCE_DEFAULT_PAGE_SIZE,
  parseMaintenancePage,
  parseMaintenancePageSize,
  parseMaintenancePropertyFilter,
  parseMaintenanceUrgency,
} from "@/lib/maintenance/maintenance-dashboard-params";
import type { MaintenanceTicketRow } from "@/lib/maintenance/maintenance-dashboard-params";

function buildMaintenanceSearchParams(opts: {
  page: number;
  pageSize: number;
  property: string;
  urgency: string;
}) {
  const p = new URLSearchParams();
  if (opts.page > 1) p.set("page", String(opts.page));
  if (opts.pageSize !== MAINTENANCE_DEFAULT_PAGE_SIZE) {
    p.set("pageSize", String(opts.pageSize));
  }
  const pt = opts.property.trim();
  if (pt) p.set("property", pt);
  if (opts.urgency !== "All") p.set("urgency", opts.urgency);
  return p.toString();
}

export default function MaintenanceDashboardLoader() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryKey = searchParams.toString();

  const parsed = useMemo(() => {
    const sp = new URLSearchParams(queryKey);
    const get = (k: string) => sp.get(k) ?? undefined;
    return {
      page: parseMaintenancePage(get("page")),
      pageSize: parseMaintenancePageSize(get("pageSize")),
      propertyFilter: parseMaintenancePropertyFilter(get("property")),
      urgency: parseMaintenanceUrgency(get("urgency")),
    };
  }, [queryKey]);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    tickets: MaintenanceTicketRow[];
    total: number;
    page: number;
    pageSize: number;
    propertyFilter: string;
    urgency: string;
  } | null>(null);

  const skipNextQueryEffectRef = useRef(false);

  const runLoad = useCallback(async (p: typeof parsed) => {
    setLoading(true);
    const { tickets, total } = await loadMaintenanceDashboardData({
      page: p.page,
      pageSize: p.pageSize,
      propertyFilter: p.propertyFilter,
      urgency: p.urgency,
    });

    const totalPages = Math.max(1, Math.ceil(total / p.pageSize));
    let effectivePage = p.page;
    let effectiveTickets = tickets;
    let effectiveTotal = total;

    if (effectivePage > totalPages && total > 0) {
      effectivePage = totalPages;
      const corrected = await loadMaintenanceDashboardData({
        page: effectivePage,
        pageSize: p.pageSize,
        propertyFilter: p.propertyFilter,
        urgency: p.urgency,
      });
      effectiveTickets = corrected.tickets;
      effectiveTotal = corrected.total;
      skipNextQueryEffectRef.current = true;
      const qs = buildMaintenanceSearchParams({
        page: effectivePage,
        pageSize: p.pageSize,
        property: p.propertyFilter,
        urgency: p.urgency,
      });
      router.replace(
        qs ? `/maintenance/dashboard?${qs}` : "/maintenance/dashboard",
        { scroll: false },
      );
    }

    setData({
      tickets: effectiveTickets,
      total: effectiveTotal,
      page: effectivePage,
      pageSize: p.pageSize,
      propertyFilter: p.propertyFilter,
      urgency: p.urgency,
    });
    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (skipNextQueryEffectRef.current) {
      skipNextQueryEffectRef.current = false;
      return;
    }
    queueMicrotask(() => {
      void runLoad(parsed);
    });
  }, [queryKey, parsed, runLoad]);

  return (
    <DashboardClient
      initialTickets={data?.tickets ?? []}
      totalCount={data?.total ?? 0}
      page={data?.page ?? parsed.page}
      pageSize={data?.pageSize ?? parsed.pageSize}
      initialPropertyFilter={data?.propertyFilter ?? parsed.propertyFilter}
      initialUrgency={data?.urgency ?? parsed.urgency}
      isTableLoading={loading}
    />
  );
}
