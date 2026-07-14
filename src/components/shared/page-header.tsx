import { cn } from "@/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

export function PageHeader({ title, description, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-6", className)}>
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
      {description ? <p className="mt-2 text-sm text-muted-foreground sm:text-base">{description}</p> : null}
    </div>
  );
}
