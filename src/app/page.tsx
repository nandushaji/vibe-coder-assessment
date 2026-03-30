"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, Wrench } from "lucide-react";

export default function Home() {
  return (
    <div className="mx-auto max-w-3xl space-y-16 pb-6">
      <section className="text-center sm:text-left">
        <h1 className="text-[2.5rem] font-normal leading-[1.15] tracking-tight text-foreground sm:text-5xl">
          How can we help?
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground sm:mx-0">
          Request a refund or report a maintenance issue. You will get a clear
          confirmation with the details you submitted.
        </p>
      </section>

      <section aria-labelledby="services-heading">
        <h2
          id="services-heading"
          className="sr-only"
        >
          Available services
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
          <Card className="rounded-2xl border border-border bg-card shadow-[var(--elevation-1)] transition-shadow duration-200 hover:shadow-[var(--elevation-2)]">
            <CardHeader className="space-y-4 pb-2">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[oklch(0.94_0.04_264)] text-[oklch(0.45_0.17_264)]">
                <FileText className="size-5" aria-hidden />
              </div>
              <div>
                <CardTitle className="text-lg font-medium tracking-tight">
                  Refund request
                </CardTitle>
                <CardDescription className="mt-2 text-[15px] leading-relaxed">
                  For billing, cancellations, or stay-related refunds.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <Link
                href="/refunds"
                className={buttonVariants({
                  variant: "default",
                  size: "lg",
                }) + " w-full"}
              >
                Get started
              </Link>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-card shadow-[var(--elevation-1)] transition-shadow duration-200 hover:shadow-[var(--elevation-2)]">
            <CardHeader className="space-y-4 pb-2">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[oklch(0.94_0.04_264)] text-[oklch(0.45_0.17_264)]">
                <Wrench className="size-5" aria-hidden />
              </div>
              <div>
                <CardTitle className="text-lg font-medium tracking-tight">
                  Maintenance
                </CardTitle>
                <CardDescription className="mt-2 text-[15px] leading-relaxed">
                  Log an issue and receive a ticket number for follow-up.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-4">
              <Link
                href="/maintenance"
                className={buttonVariants({
                  variant: "default",
                  size: "lg",
                }) + " w-full"}
              >
                Report an issue
              </Link>
              <Link
                href="/maintenance/dashboard"
                className={buttonVariants({
                  variant: "outline",
                  size: "lg",
                }) + " w-full"}
              >
                Open dashboard
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
