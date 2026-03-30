"use client";

import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Vibe Coder Assessment</h1>
          <p className="text-lg text-gray-600 mt-2">Part B: Practical Mini Apps</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Guest Refund Form</CardTitle>
              <CardDescription>
                A web-based form where a guest can request a refund with conditional logic and data persistence.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/refunds" className={buttonVariants({ variant: "default" }) + " w-full"}>Open Refund Form</Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Maintenance Logger</CardTitle>
              <CardDescription>
                A mini app to submit maintenance issues and a dashboard to track and update their status.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/maintenance" className={buttonVariants({ variant: "outline" }) + " w-full"}>Submit Issue</Link>
              <Link href="/maintenance/dashboard" className={buttonVariants({ variant: "default" }) + " w-full"}>View Dashboard</Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
