"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { cn } from "@/lib/utils";

const contentEnterClasses =
  "relative mx-auto w-full max-w-[68rem] px-5 py-10 sm:px-8 sm:py-14 motion-reduce:animate-none animate-in fade-in-0 duration-200 ease-out fill-mode-both";

const contentStaticClasses =
  "relative mx-auto w-full max-w-[68rem] px-5 py-10 sm:px-8 sm:py-14";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const skipContentEnterAnimation = pathname.includes("/dashboard");

  if (isAdmin) {
    return (
      <div className="flex min-h-full flex-col bg-background">{children}</div>
    );
  }

  return (
    <div className="flex min-h-full flex-col bg-background">
      <SiteHeader />
      <main className="relative flex-1">
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,var(--shell-tint)_0%,transparent_42%)] opacity-80"
          aria-hidden
        />
        <div
          key={pathname}
          className={cn(
            skipContentEnterAnimation ? contentStaticClasses : contentEnterClasses,
          )}
        >
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
