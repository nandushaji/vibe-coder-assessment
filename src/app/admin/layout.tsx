import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin | Refund review",
  description: "Internal refund request review (staff only).",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh min-h-full bg-[oklch(0.98_0.01_264)] dark:bg-background">
      {children}
    </div>
  );
}
