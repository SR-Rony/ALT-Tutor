import { cn } from "@/utils";
import { richTextToPlain } from "@/lib/rich-text";

interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

export function PageHeader({ title, description, className }: PageHeaderProps) {
  const plainTitle = richTextToPlain(title) || title;
  const plainDescription = description
    ? richTextToPlain(description) || description
    : undefined;

  return (
    <div className={cn("mb-6", className)}>
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{plainTitle}</h1>
      {plainDescription ? (
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">{plainDescription}</p>
      ) : null}
    </div>
  );
}
