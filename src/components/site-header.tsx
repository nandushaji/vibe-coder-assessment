"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HelpCircle, Menu } from "lucide-react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";

type NavItem = {
  href: string;
  label: string;
  exact?: boolean;
};

const nav: NavItem[] = [
  { href: "/", label: "Home", exact: true },
  { href: "/refunds", label: "Refunds" },
  { href: "/maintenance", label: "Maintenance", exact: true },
  { href: "/maintenance/dashboard", label: "Dashboard" },
];

/** Snappy easing — shorter duration keeps nav feeling instant, not sluggish */
const TAB_EASE = "cubic-bezier(0.2, 0, 0, 1)";
const TAB_DURATION_MS = 200;
const MOBILE_DRAWER_MS = 200;

function isNavActive(
  pathname: string,
  href: string,
  exact?: boolean,
): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const activeIndex = nav.findIndex((item) =>
    isNavActive(pathname, item.href, item.exact),
  );

  const pillRef = useRef<HTMLSpanElement | null>(null);
  const rafRef = useRef<number | null>(null);

  /** DOM-only updates — avoids setState in layout effects (eslint react-hooks/set-state-in-effect). */
  const applyIndicatorLayout = useCallback(() => {
    const el = pillRef.current;
    const container = navRef.current;
    if (!el) return;
    const transition = `transform ${TAB_DURATION_MS}ms ${TAB_EASE}, width ${TAB_DURATION_MS}ms ${TAB_EASE}, opacity 120ms ${TAB_EASE}`;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.style.transition = reduceMotion ? "none" : transition;
    if (!container || activeIndex < 0) {
      el.style.opacity = "0";
      return;
    }
    const link = linkRefs.current[activeIndex];
    if (!link) {
      el.style.opacity = "0";
      return;
    }
    const navRect = container.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    const left = linkRect.left - navRect.left;
    el.style.width = `${linkRect.width}px`;
    el.style.opacity = "1";
    el.style.transform = `translate3d(${left}px, 0, 0)`;
  }, [activeIndex]);

  const scheduleIndicatorUpdate = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      applyIndicatorLayout();
    });
  }, [applyIndicatorLayout]);

  useLayoutEffect(() => {
    applyIndicatorLayout();
  }, [applyIndicatorLayout, pathname]);

  useLayoutEffect(() => {
    const container = navRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => scheduleIndicatorUpdate());
    ro.observe(container);
    window.addEventListener("resize", scheduleIndicatorUpdate, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", scheduleIndicatorUpdate);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [scheduleIndicatorUpdate]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card shadow-[var(--elevation-1)]">
      <div
        className="border-b border-primary/15 bg-[oklch(0.96_0.04_264)] px-4 py-2 text-center text-xs text-[oklch(0.42_0.12_264)] sm:text-[13px]"
        role="status"
      >
        <span className="font-medium text-[oklch(0.45_0.17_264)]">
          Secure connection
        </span>
        <span className="mx-2 text-border" aria-hidden>
          ·
        </span>
        Your data is protected with encryption in transit
      </div>
      <div className="mx-auto flex h-14 max-w-[68rem] items-center justify-between gap-4 px-5 sm:h-[3.75rem] sm:px-8">
        <BrandLogo />

        <nav
          ref={navRef}
          className="relative isolate hidden items-center gap-0.5 rounded-full bg-muted/45 p-1 [contain:layout] md:flex"
          aria-label="Main navigation"
        >
          <span
            ref={pillRef}
            aria-hidden
            className="pointer-events-none absolute top-1 left-0 bottom-1 w-0 rounded-full bg-card opacity-0 shadow-[0_1px_2px_rgba(60,64,67,0.12)] ring-1 ring-border/50 motion-reduce:transition-none"
          />
          {nav.map(({ href, label, exact }, i) => {
            const active = isNavActive(pathname, href, exact);
            return (
              <Link
                key={href}
                href={href}
                ref={(el) => {
                  linkRefs.current[i] = el;
                }}
                className={cn(
                  "relative z-10 rounded-full px-4 py-2 text-sm font-medium outline-none transition-colors duration-200 ease-out",
                  "focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                  active
                    ? "text-[oklch(0.42_0.14_264)]"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="mailto:support@example.com"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "hidden gap-2 sm:inline-flex",
            )}
          >
            <HelpCircle className="size-4" aria-hidden />
            Help
          </a>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((o) => !o)}
          >
            <Menu className="size-5" aria-hidden />
            <span className="sr-only">Menu</span>
          </Button>
        </div>
      </div>

      <div
        id="mobile-nav"
        className={cn(
          "grid overflow-hidden transition-[grid-template-rows] ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none md:hidden",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
        style={{ transitionDuration: `${MOBILE_DRAWER_MS}ms` }}
        aria-hidden={!open}
      >
        <div className="min-h-0">
          <div className="border-t border-border bg-card px-4 py-3">
            <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
              {nav.map(({ href, label, exact }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "rounded-full px-4 py-3 text-sm font-medium transition-[transform,background-color,color] duration-150 ease-out",
                    "motion-reduce:transition-colors",
                    "active:scale-[0.99]",
                    isNavActive(pathname, href, exact)
                      ? "bg-[oklch(0.94_0.04_264)] text-[oklch(0.42_0.14_264)]"
                      : "text-muted-foreground hover:bg-muted/70",
                  )}
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              ))}
              <a
                href="mailto:support@example.com"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "mt-2 justify-center transition-opacity duration-200",
                  open ? "opacity-100" : "opacity-0",
                )}
                onClick={() => setOpen(false)}
              >
                Contact help
              </a>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
