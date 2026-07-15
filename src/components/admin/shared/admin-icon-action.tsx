"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/utils";

type ActionTone = "default" | "primary" | "success" | "warning" | "danger";

const toneClass: Record<ActionTone, string> = {
  default: "text-muted-foreground hover:bg-muted hover:text-foreground",
  primary: "text-primary hover:bg-primary/10 hover:text-primary",
  success: "text-accent-green hover:bg-[#ecfdf3] hover:text-accent-green",
  warning: "text-[#f59e0b] hover:bg-[#fffbeb] hover:text-[#d97706]",
  danger: "text-accent hover:bg-accent/10 hover:text-accent",
};

type AdminIconActionProps = {
  label: string;
  icon: LucideIcon;
  tone?: ActionTone;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "onClick">;

export function AdminIconAction({
  label,
  icon: Icon,
  tone = "default",
  disabled,
  onClick,
  className,
  ...props
}: AdminIconActionProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            aria-label={label}
            title={label}
            onClick={onClick}
            className={cn(
              "h-8 w-8 shrink-0 rounded-lg border border-transparent",
              toneClass[tone],
              className
            )}
            {...props}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function AdminActionsBar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex w-full items-center justify-end gap-1", className)}>{children}</div>;
}
