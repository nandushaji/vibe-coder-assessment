import Link from "next/link";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  showTagline?: boolean;
};

export function BrandLogo({ className, showTagline = true }: BrandLogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        "group flex items-center gap-3 rounded-full py-1 pl-1 pr-2 outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2",
        className
      )}
    >
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_1px_2px_rgba(26,115,232,0.4)] transition-transform duration-200 group-hover:scale-[1.03]"
        aria-hidden
      >
        <svg
          viewBox="0 0 24 24"
          className="size-[18px]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-8H9v8H4a1 1 0 0 1-1-1V9.5z" />
        </svg>
      </span>
      <span className="min-w-0 text-left leading-none">
        <span className="block text-[15px] font-medium tracking-tight text-foreground">
          Guest services
        </span>
        {showTagline ? (
          <span className="mt-1 block text-xs font-normal text-muted-foreground">
            Refunds &amp; maintenance
          </span>
        ) : null}
      </span>
    </Link>
  );
}
