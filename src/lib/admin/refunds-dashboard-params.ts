/** URL/query parsing for refunds dashboard — safe to import from client components. */

export type RefundDashboardStatusFilter =
  | "all"
  | "pending"
  | "accepted"
  | "rejected";

export const REFUNDS_DEFAULT_PAGE_SIZE = 10;
export const REFUNDS_MAX_PAGE_SIZE = 50;

export type RefundDashboardStats = {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
};

function firstParam(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export function parseRefundPage(
  raw: string | string[] | undefined,
): number {
  const v = firstParam(raw);
  const n = Number(v);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

export function parseRefundPageSize(
  raw: string | string[] | undefined,
): number {
  const v = firstParam(raw);
  const n = Number(v);
  if (!Number.isFinite(n) || n < 1) return REFUNDS_DEFAULT_PAGE_SIZE;
  return Math.min(Math.floor(n), REFUNDS_MAX_PAGE_SIZE);
}

export function parseRefundStatusFilter(
  raw: string | string[] | undefined,
): RefundDashboardStatusFilter {
  const v = firstParam(raw);
  return parseRefundStatusFilterString(v ?? "");
}

export function parseRefundStatusFilterString(
  raw: string,
): RefundDashboardStatusFilter {
  const v = raw.trim();
  if (v === "pending" || v === "accepted" || v === "rejected") return v;
  return "all";
}

export function parseRefundSearchQuery(
  raw: string | string[] | undefined,
): string {
  const v = firstParam(raw);
  if (typeof v !== "string") return "";
  return v.slice(0, 200);
}
