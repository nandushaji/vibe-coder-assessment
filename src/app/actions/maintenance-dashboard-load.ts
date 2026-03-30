"use server";

import { getMaintenanceTicketsPaged } from "@/lib/maintenance/dashboard-data";

export async function loadMaintenanceDashboardData(params: {
  page: number;
  pageSize: number;
  propertyFilter: string;
  urgency: string;
}) {
  return getMaintenanceTicketsPaged(params);
}
