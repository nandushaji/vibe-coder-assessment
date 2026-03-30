import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("mb-10 border-b border-border pb-10", className)}>
      {eyebrow ? (
        <p className="text-sm font-medium text-primary">{eyebrow}</p>
      ) : null}
      <h1 className="mt-1 text-[1.75rem] font-normal leading-tight tracking-tight text-foreground sm:text-[2rem]">
        {title}
      </h1>
      {description ? (
        <p className="mt-3 max-w-[36rem] text-base leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
    </header>
  );
}
