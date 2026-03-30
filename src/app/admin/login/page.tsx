import { Receipt } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdminLoginForm } from "@/components/admin-login-form";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center bg-[oklch(0.975_0.004_264)] px-4 py-12 dark:bg-background">
      <Card className="w-full max-w-md rounded-2xl border border-border/90 bg-card shadow-[0_1px_3px_rgba(60,64,67,0.12)]">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
            <Receipt className="size-6" strokeWidth={1.75} aria-hidden />
          </div>
          <div className="space-y-1">
            <p className="text-[0.6875rem] font-semibold tracking-wide text-muted-foreground uppercase">
              Operations
            </p>
            <CardTitle className="text-xl font-semibold tracking-tight">
              Sign in
            </CardTitle>
            <CardDescription className="text-[0.8125rem] leading-relaxed">
              Refund review is for authorized staff only. Credentials are set in
              server secrets, not in the browser.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <AdminLoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
