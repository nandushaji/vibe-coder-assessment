"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { REFUND_CSV_EXPORT_LIMIT } from "@/lib/admin/refund-admin";
import { assertAdminSession } from "@/lib/admin/session-server";
import type { RefundDashboardStatusFilter } from "@/lib/admin/refunds-dashboard-params";
import { parseRefundStatusFilterString } from "@/lib/admin/refunds-dashboard-params";
import {
  fetchRefundDashboardStats,
  fetchRefundsDashboardPage,
  fetchRefundsForExport,
} from "@/lib/admin/refunds-query";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const reviewStatusSchema = z.enum(["pending", "accepted", "rejected"]);

export async function updateRefundReviewStatus(
  id: string,
  status: z.infer<typeof reviewStatusSchema>
) {
  const parsed = reviewStatusSchema.safeParse(status);
  if (!parsed.success) {
    return { success: false as const, error: "Invalid status." };
  }

  if (!(await assertAdminSession())) {
    return { success: false as const, error: "Unauthorized." };
  }

  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from("refunds")
      .update({ review_status: parsed.data })
      .eq("id", id);

    if (error) {
      console.error("updateRefundReviewStatus:", error);
      return { success: false as const, error: error.message };
    }

    revalidatePath("/admin/refunds");
    return { success: true as const };
  } catch (e) {
    console.error("updateRefundReviewStatus:", e);
    return {
      success: false as const,
      error:
        e instanceof Error ? e.message : "Could not update. Check configuration.",
    };
  }
}

export async function exportRefundRowsForCsv(q: string, statusRaw: string) {
  if (!(await assertAdminSession())) {
    return { success: false as const, error: "Unauthorized." };
  }

  const status = parseRefundStatusFilterString(statusRaw);
  const { rows, error } = await fetchRefundsForExport({
    status,
    q: q.slice(0, 200),
    limit: REFUND_CSV_EXPORT_LIMIT,
  });

  if (error) {
    return { success: false as const, error };
  }

  return { success: true as const, rows };
}

export async function loadRefundsDashboard(payload: {
  page: number;
  pageSize: number;
  status: RefundDashboardStatusFilter;
  q: string;
}) {
  if (!(await assertAdminSession())) {
    return {
      success: false as const,
      error: "Unauthorized.",
      missingServiceRole: false,
    };
  }

  try {
    const [statsRes, pageRes] = await Promise.all([
      fetchRefundDashboardStats(),
      fetchRefundsDashboardPage({
        page: payload.page,
        pageSize: payload.pageSize,
        status: payload.status,
        q: payload.q,
      }),
    ]);

    const err = statsRes.error ?? pageRes.error;
    if (err) {
      const missingServiceRole =
        err === "MISSING_SERVICE_ROLE_KEY" ||
        err.includes("SUPABASE_SERVICE_ROLE_KEY");
      return {
        success: false as const,
        error: err,
        missingServiceRole,
      };
    }

    let rows = pageRes.rows;
    let total = pageRes.total;
    let effectivePage = payload.page;
    const totalPages = Math.max(1, Math.ceil(total / payload.pageSize));
    if (effectivePage > totalPages && total > 0) {
      effectivePage = totalPages;
      const corrected = await fetchRefundsDashboardPage({
        page: effectivePage,
        pageSize: payload.pageSize,
        status: payload.status,
        q: payload.q,
      });
      if (corrected.error) {
        return {
          success: false as const,
          error: corrected.error,
          missingServiceRole: false,
        };
      }
      rows = corrected.rows;
      total = corrected.total;
    }

    return {
      success: true as const,
      stats: statsRes.stats,
      rows,
      total,
      page: effectivePage,
      pageSize: payload.pageSize,
      status: payload.status,
      q: payload.q,
      urlNeedsSync: effectivePage !== payload.page,
    };
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "Could not load refund requests.";
    return {
      success: false as const,
      error: msg,
      missingServiceRole: false,
    };
  }
}
