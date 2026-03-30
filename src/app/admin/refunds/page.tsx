import { Suspense } from "react";
import { RefundsTableSkeleton } from "@/components/admin/refunds-dashboard-skeleton";
import AdminRefundsPageClient from "./admin-refunds-page-client";

export const dynamic = "force-dynamic";

function SearchParamsFallback() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pt-6">
      <RefundsTableSkeleton />
    </div>
  );
}

export default function AdminRefundsPage() {
  return (
    <Suspense fallback={<SearchParamsFallback />}>
      <AdminRefundsPageClient />
    </Suspense>
  );
}
