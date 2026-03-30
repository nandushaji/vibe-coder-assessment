"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function mergeRefs<T>(
  ...refs: (React.Ref<T> | undefined | null)[]
): React.RefCallback<T> {
  return (node) => {
    for (const ref of refs) {
      if (ref == null) continue
      if (typeof ref === "function") ref(node)
      else (ref as React.MutableRefObject<T | null>).current = node
    }
  }
}

export type FileInputProps = Omit<
  React.ComponentProps<"input">,
  "type" | "value"
> & {
  /**
   * Bound form field value (e.g. RHF). When cleared to empty, the native input
   * and filename label reset — needed because file inputs are uncontrolled.
   */
  formValue?: string | null
}

/**
 * Production file picker: native <input type="file"> cannot be styled or
 * aligned reliably across browsers. This uses an invisible full-size input
 * for hit-testing and a flex row for the visible “Choose file” + filename.
 */
const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  function FileInput(
    { className, formValue, onChange, disabled, ...inputProps },
    forwardedRef
  ) {
    const invalid =
      inputProps["aria-invalid"] === true ||
      inputProps["aria-invalid"] === "true"
    const innerRef = React.useRef<HTMLInputElement>(null)
    const [fileName, setFileName] = React.useState<string | null>(null)

    React.useEffect(() => {
      if (formValue === undefined) return
      if (formValue !== "" && formValue != null) return
      setFileName(null)
      const el = innerRef.current
      if (el) el.value = ""
    }, [formValue])

    return (
      <div
        className={cn(
          "relative flex h-11 w-full min-w-0 items-stretch overflow-hidden rounded-xl border border-input bg-card shadow-[0_1px_2px_rgba(60,64,67,0.08)] transition-[border-color,box-shadow]",
          "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25",
          invalid &&
            "border-destructive focus-within:border-destructive focus-within:ring-destructive/20 dark:border-destructive/50 dark:focus-within:ring-destructive/40",
          disabled && "pointer-events-none opacity-50",
          className
        )}
      >
        <input
          {...inputProps}
          ref={mergeRefs(forwardedRef, innerRef)}
          type="file"
          disabled={disabled}
          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          onChange={(e) => {
            const f = e.target.files?.[0]
            setFileName(f?.name ?? null)
            onChange?.(e)
          }}
        />
        <div className="pointer-events-none relative z-0 flex min-h-0 min-w-0 flex-1 items-center gap-3 px-3 py-0">
          <span
            aria-hidden
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-input bg-muted/50 px-3.5 text-sm font-medium text-foreground shadow-[0_1px_2px_rgba(60,64,67,0.08)]"
          >
            Choose file
          </span>
          <span className="min-w-0 flex-1 truncate text-left text-sm text-muted-foreground">
            {fileName ?? "No file chosen"}
          </span>
        </div>
      </div>
    )
  }
)

FileInput.displayName = "FileInput"

export { FileInput }
