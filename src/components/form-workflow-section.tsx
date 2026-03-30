import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const sectionSurface =
  "transition-shadow duration-200 hover:shadow-[var(--elevation-2)]";

export function FormWorkflowSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn(sectionSurface, "rounded-2xl", className)}>
      <CardHeader className="space-y-1.5 pb-5">
        <CardTitle className="text-lg font-medium tracking-tight text-foreground">
          {title}
        </CardTitle>
        {description ? (
          <CardDescription className="text-[15px] leading-relaxed text-muted-foreground">
            {description}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4 pt-0">{children}</CardContent>
    </Card>
  );
}
