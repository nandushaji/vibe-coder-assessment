"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadRefundsDashboard } from "@/app/actions/admin-refunds";
import { RefundsDashboard } from "@/components/admin/refunds-dashboard";
import { RefundsLoadError } from "@/components/admin/refunds-load-error";
import {
  parseRefundPage,
  parseRefundPageSize,
  parseRefundSearchQuery,
  parseRefundStatusFilter,
  REFUNDS_DEFAULT_PAGE_SIZE,
} from "@/lib/admin/refunds-dashboard-params";
import type { RefundAdminRow } from "@/lib/admin/refund-admin";
import type {
  RefundDashboardStats,
  RefundDashboardStatusFilter,
} from "@/lib/admin/refunds-dashboard-params";

function buildRefundsSearchParams(opts: {
  page: number;
  pageSize: number;
  q: string;
  status: string;
}) {
  const p = new URLSearchParams();
  if (opts.page > 1) p.set("page", String(opts.page));
  if (opts.pageSize !== REFUNDS_DEFAULT_PAGE_SIZE) {
    p.set("pageSize", String(opts.pageSize));
  }
  const qt = opts.q.trim();
  if (qt) p.set("q", qt);
  if (opts.status !== "all") p.set("status", opts.status);
  return p.toString();
}

export default function AdminRefundsPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryKey = searchParams.toString();

  const parsed = useMemo(() => {
    const sp = new URLSearchParams(queryKey);
    const get = (k: string) => sp.get(k) ?? undefined;
    return {
      page: parseRefundPage(get("page")),
      pageSize: parseRefundPageSize(get("pageSize")),
      status: parseRefundStatusFilter(get("status")),
      q: parseRefundSearchQuery(get("q")),
    };
  }, [queryKey]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{
    message: string;
    missingServiceRole: boolean;
  } | null>(null);
  const [data, setData] = useState<{
    stats: RefundDashboardStats;
    rows: RefundAdminRow[];
    total: number;
    page: number;
    pageSize: number;
    status: RefundDashboardStatusFilter;
    q: string;
  } | null>(null);

  const skipNextQueryEffectRef = useRef(false);

  const runLoad = useCallback(async (p: typeof parsed) => {
    setLoading(true);
    setError(null);
    const result = await loadRefundsDashboard({
      page: p.page,
      pageSize: p.pageSize,
      status: p.status,
      q: p.q,
    });

    if (!result.success) {
      setData(null);
      setError({
        message: result.error,
        missingServiceRole:
          "missingServiceRole" in result ? result.missingServiceRole : false,
      });
      setLoading(false);
      return;
    }

    if (result.urlNeedsSync) {
      skipNextQueryEffectRef.current = true;
      const qs = buildRefundsSearchParams({
        page: result.page,
        pageSize: result.pageSize,
        q: result.q,
        status: result.status,
      });
      router.replace(qs ? `/admin/refunds?${qs}` : "/admin/refunds", {
        scroll: false,
      });
    }

    setData({
      stats: result.stats,
      rows: result.rows,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      status: result.status,
      q: result.q,
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

  if (error) {
    return (
      <RefundsLoadError
        errorMessage={error.message}
        missingServiceRole={error.missingServiceRole}
      />
    );
  }

  const emptyStats: RefundDashboardStats = {
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
  };

  return (
    <RefundsDashboard
      rows={data?.rows ?? []}
      stats={data?.stats ?? emptyStats}
      totalFiltered={data?.total ?? 0}
      page={data?.page ?? parsed.page}
      pageSize={data?.pageSize ?? parsed.pageSize}
      initialQuery={data?.q ?? parsed.q}
      initialStatus={data?.status ?? parsed.status}
      isTableLoading={loading}
    />
  );
}
