import { Suspense } from "react";
import { MaintenanceTableSkeleton } from "@/components/maintenance/maintenance-dashboard-skeleton";
import MaintenanceDashboardLoader from "./maintenance-dashboard-loader";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full space-y-8 pt-4">
          <MaintenanceTableSkeleton />
        </div>
      }
    >
      <MaintenanceDashboardLoader />
    </Suspense>
  );
}
