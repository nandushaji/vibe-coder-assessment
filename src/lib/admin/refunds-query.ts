import { createServiceRoleClient } from "@/lib/supabase/service-role";
import {
  normalizeReviewStatus,
  type RefundAdminRow,
} from "@/lib/admin/refund-admin";
import type {
  RefundDashboardStats,
  RefundDashboardStatusFilter,
} from "@/lib/admin/refunds-dashboard-params";

export type {
  RefundDashboardStats,
  RefundDashboardStatusFilter,
} from "@/lib/admin/refunds-dashboard-params";

function mapRefundRow(row: Record<string, unknown>): RefundAdminRow {
  return {
    id: String(row.id ?? ""),
    full_name: String(row.full_name ?? ""),
    email: String(row.email ?? ""),
    booking_reference: String(row.booking_reference ?? ""),
    booking_date: String(row.booking_date ?? ""),
    refund_reason: String(row.refund_reason ?? ""),
    additional_details:
      row.additional_details == null ? null : String(row.additional_details),
    file_url:
      row.file_url == null || row.file_url === "" ? null : String(row.file_url),
    created_at: String(row.created_at ?? ""),
    review_status: normalizeReviewStatus(row.review_status),
  };
}

function escapeIlikeFragment(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

function applyStatusAndSearch<
  T extends {
    eq: (c: string, v: string) => T;
    or: (s: string) => T;
  },
>(query: T, status: RefundDashboardStatusFilter, q: string): T {
  let q2: T = query;
  if (status !== "all") {
    q2 = q2.eq("review_status", status);
  }
  const cleaned = q.trim().replace(/,/g, " ").slice(0, 200);
  if (cleaned.length > 0) {
    const p = `%${escapeIlikeFragment(cleaned)}%`;
    q2 = q2.or(
      `full_name.ilike.${p},email.ilike.${p},booking_reference.ilike.${p},refund_reason.ilike.${p},additional_details.ilike.${p}`,
    );
  }
  return q2;
}

export async function fetchRefundDashboardStats(): Promise<{
  stats: RefundDashboardStats;
  error: string | null;
}> {
  try {
    const supabase = createServiceRoleClient();
    const [total, pending, accepted, rejected] = await Promise.all([
      supabase.from("refunds").select("*", { count: "exact", head: true }),
      supabase
        .from("refunds")
        .select("*", { count: "exact", head: true })
        .eq("review_status", "pending"),
      supabase
        .from("refunds")
        .select("*", { count: "exact", head: true })
        .eq("review_status", "accepted"),
      supabase
        .from("refunds")
        .select("*", { count: "exact", head: true })
        .eq("review_status", "rejected"),
    ]);
    const err =
      total.error?.message ??
      pending.error?.message ??
      accepted.error?.message ??
      rejected.error?.message ??
      null;
    if (err) {
      return {
        stats: { total: 0, pending: 0, accepted: 0, rejected: 0 },
        error: err,
      };
    }
    return {
      stats: {
        total: total.count ?? 0,
        pending: pending.count ?? 0,
        accepted: accepted.count ?? 0,
        rejected: rejected.count ?? 0,
      },
      error: null,
    };
  } catch (e) {
    return {
      stats: { total: 0, pending: 0, accepted: 0, rejected: 0 },
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export async function fetchRefundsDashboardPage(params: {
  page: number;
  pageSize: number;
  status: RefundDashboardStatusFilter;
  q: string;
}): Promise<{ rows: RefundAdminRow[]; total: number; error: string | null }> {
  try {
    const supabase = createServiceRoleClient();
    const from = (params.page - 1) * params.pageSize;
    const to = from + params.pageSize - 1;

    let query = supabase.from("refunds").select("*", { count: "exact" });
    query = applyStatusAndSearch(query, params.status, params.q);

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return { rows: [], total: 0, error: error.message };
    }

    return {
      rows: (data ?? []).map((row) =>
        mapRefundRow(row as Record<string, unknown>),
      ),
      total: count ?? 0,
      error: null,
    };
  } catch (e) {
    return {
      rows: [],
      total: 0,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export async function fetchRefundsForExport(params: {
  status: RefundDashboardStatusFilter;
  q: string;
  limit: number;
}): Promise<{ rows: RefundAdminRow[]; error: string | null }> {
  try {
    const supabase = createServiceRoleClient();
    let query = supabase.from("refunds").select("*").limit(params.limit);
    query = applyStatusAndSearch(query, params.status, params.q);

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });
    if (error) {
      return { rows: [], error: error.message };
    }
    return {
      rows: (data ?? []).map((row) =>
        mapRefundRow(row as Record<string, unknown>),
      ),
      error: null,
    };
  } catch (e) {
    return { rows: [], error: e instanceof Error ? e.message : "Unknown error" };
  }
}
