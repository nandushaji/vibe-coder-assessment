import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-muted/30 text-sm text-muted-foreground">
      <div className="mx-auto max-w-[68rem] px-5 py-12 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          <div className="lg:col-span-2">
            <p className="text-base font-medium text-foreground">Guest services</p>
            <p className="mt-3 max-w-md leading-relaxed">
              Self-service for refunds and maintenance. Requests are saved
              securely and reviewed by our team.
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Links</p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/refunds"
                  className="text-primary hover:underline hover:underline-offset-4"
                >
                  Refund request
                </Link>
              </li>
              <li>
                <Link
                  href="/maintenance"
                  className="text-primary hover:underline hover:underline-offset-4"
                >
                  Report maintenance
                </Link>
              </li>
              <li>
                <Link
                  href="/maintenance/dashboard"
                  className="text-primary hover:underline hover:underline-offset-4"
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Help</p>
            <ul className="mt-3 space-y-2">
              <li>
                <a
                  href="mailto:support@example.com"
                  className="text-primary hover:underline hover:underline-offset-4"
                >
                  support@example.com
                </a>
              </li>
              <li className="leading-relaxed">We usually reply within one day.</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-8 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Guest services</p>
          <p>
            <Link
              href="/"
              className="text-primary hover:underline hover:underline-offset-4"
            >
              Privacy
            </Link>
            <span className="mx-2 text-border" aria-hidden>
              ·
            </span>
            <Link
              href="/"
              className="text-primary hover:underline hover:underline-offset-4"
            >
              Terms
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
