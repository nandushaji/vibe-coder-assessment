export const REFUND_CSV_EXPORT_LIMIT = 3000;

export type RefundReviewStatus = "pending" | "accepted" | "rejected";

export type RefundAdminRow = {
  id: string;
  full_name: string;
  email: string;
  booking_reference: string;
  booking_date: string;
  refund_reason: string;
  additional_details: string | null;
  file_url: string | null;
  created_at: string;
  review_status: RefundReviewStatus;
};

export type RefundAdminStats = {
  total: number;
  last7Days: number;
  withEvidence: number;
  uniqueGuests: number;
  pending: number;
  accepted: number;
  rejected: number;
};

export function normalizeReviewStatus(raw: unknown): RefundReviewStatus {
  if (raw === "accepted" || raw === "rejected" || raw === "pending") {
    return raw;
  }
  return "pending";
}

export function computeRefundStats(rows: RefundAdminRow[] | null | undefined): RefundAdminStats {
  const list = Array.isArray(rows) ? rows : [];
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const emails = new Set<string>();
  let last7Days = 0;
  let withEvidence = 0;
  let pending = 0;
  let accepted = 0;
  let rejected = 0;

  for (const r of list) {
    emails.add(r.email.trim().toLowerCase());
    if (r.file_url) withEvidence++;
    const t = new Date(r.created_at).getTime();
    if (!Number.isNaN(t) && t >= sevenDaysAgo) last7Days++;
    switch (r.review_status) {
      case "pending":
        pending++;
        break;
      case "accepted":
        accepted++;
        break;
      case "rejected":
        rejected++;
        break;
      default:
        pending++;
    }
  }

  return {
    total: list.length,
    last7Days,
    withEvidence,
    uniqueGuests: emails.size,
    pending,
    accepted,
    rejected,
  };
}
