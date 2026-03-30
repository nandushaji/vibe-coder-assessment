/** URL/query parsing for maintenance dashboard — safe to import from client components. */

export type MaintenanceTicketRow = {
  id: string;
  ticketNumber: string;
  property: string;
  category: string;
  urgency: string;
  description: string;
  photoUrl: string | null;
  status: string;
  createdAt: string;
};

export const MAINTENANCE_DEFAULT_PAGE_SIZE = 10;
export const MAINTENANCE_MAX_PAGE_SIZE = 50;

function firstSearchParam(
  v: string | string[] | undefined,
): string | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export function parseMaintenancePage(
  raw: string | string[] | undefined,
): number {
  const v = firstSearchParam(raw);
  const n = Number(v);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

export function parseMaintenancePageSize(
  raw: string | string[] | undefined,
): number {
  const v = firstSearchParam(raw);
  const n = Number(v);
  if (!Number.isFinite(n) || n < 1) return MAINTENANCE_DEFAULT_PAGE_SIZE;
  return Math.min(Math.floor(n), MAINTENANCE_MAX_PAGE_SIZE);
}

export function parseMaintenancePropertyFilter(
  raw: string | string[] | undefined,
): string {
  const v = firstSearchParam(raw);
  if (typeof v !== "string") return "";
  return v.slice(0, 200);
}

export function parseMaintenanceUrgency(
  raw: string | string[] | undefined,
): string {
  const v = firstSearchParam(raw);
  if (v === "Low" || v === "Medium" || v === "High") return v;
  return "All";
}
