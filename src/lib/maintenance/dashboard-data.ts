import { createAdminClient } from "@/lib/supabase/admin";
import type { MaintenanceTicketRow } from "@/lib/maintenance/maintenance-dashboard-params";

export {
  MAINTENANCE_DEFAULT_PAGE_SIZE,
  MAINTENANCE_MAX_PAGE_SIZE,
} from "@/lib/maintenance/maintenance-dashboard-params";

export type { MaintenanceTicketRow } from "@/lib/maintenance/maintenance-dashboard-params";

function ticketRowToClient(row: Record<string, unknown>): MaintenanceTicketRow {
  return {
    id: String(row.id ?? ""),
    ticketNumber: String(row.ticket_number ?? ""),
    property: String(row.property ?? ""),
    category: String(row.category ?? ""),
    urgency: String(row.urgency ?? ""),
    description: String(row.description ?? ""),
    photoUrl:
      row.photo_url != null && row.photo_url !== ""
        ? String(row.photo_url)
        : null,
    status: String(row.status ?? "Open"),
    createdAt: row.created_at != null ? String(row.created_at) : "",
  };
}

function escapeMaintenanceIlike(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export async function getMaintenanceTicketsPaged(params: {
  page: number;
  pageSize: number;
  propertyFilter: string;
  urgency: string;
}): Promise<{ tickets: MaintenanceTicketRow[]; total: number }> {
  const supabase = createAdminClient();
  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;

  let q = supabase.from("maintenance_tickets").select("*", { count: "exact" });

  const pq = params.propertyFilter.trim();
  if (pq.length > 0) {
    q = q.ilike("property", `%${escapeMaintenanceIlike(pq)}%`);
  }
  if (params.urgency !== "All") {
    q = q.eq("urgency", params.urgency);
  }

  const { data, error, count } = await q
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    if (error.code === "PGRST205") {
      console.error(
        "getMaintenanceTicketsPaged: Table not found (PGRST205). Apply migrations: `npm run db:link` then `npm run db:push`, or run the SQL in supabase/migrations/* in order. See README.",
      );
    } else {
      console.error("getMaintenanceTicketsPaged:", error);
    }
    return { tickets: [], total: 0 };
  }

  return {
    tickets: (data ?? []).map((row) =>
      ticketRowToClient(row as Record<string, unknown>),
    ),
    total: count ?? 0,
  };
}
