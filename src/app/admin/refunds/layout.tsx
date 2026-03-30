import type { Metadata } from "next";
import { LogOut, Receipt } from "lucide-react";
import { adminLogout } from "@/app/actions/admin-auth";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Refunds · Operations",
  description: "Review guest refund requests.",
};

export default function AdminRefundsSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col bg-[oklch(0.975_0.004_264)] dark:bg-background">
      <header className="sticky top-0 z-40 border-b border-border/90 bg-card/95 pt-[env(safe-area-inset-top)] shadow-[0_1px_2px_rgba(60,64,67,0.06)] backdrop-blur-sm supports-backdrop-filter:bg-card/80">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-2 px-3 sm:h-16 sm:gap-4 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm ring-1 ring-primary/15 sm:size-10"
              aria-hidden
            >
              <Receipt className="size-[1.125rem] sm:size-5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[0.625rem] font-medium tracking-wide text-muted-foreground uppercase sm:text-[0.6875rem]">
                Operations
              </p>
              <h1 className="truncate text-[0.9375rem] font-semibold tracking-tight text-foreground sm:text-lg">
                Refund requests
              </h1>
            </div>
          </div>
          <form action={adminLogout} className="shrink-0">
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="h-9 rounded-full border-border/90 px-2.5 font-medium shadow-sm sm:px-4"
              aria-label="Sign out"
            >
              <LogOut className="size-4 sm:hidden" aria-hidden />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </form>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
