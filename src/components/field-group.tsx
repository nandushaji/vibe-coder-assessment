import * as React from "react"

import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

/**
 * Standalone label + control stack (gap matches FormItem). Use outside RHF
 * for filters, toolbars, etc.
 */
export function FieldGroup({
  label,
  htmlFor,
  className,
  children,
}: {
  label: React.ReactNode
  htmlFor?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}
