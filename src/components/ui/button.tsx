import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils";

export const buttonVariants = cva(
  "relative inline-flex isolate items-center justify-center gap-2 overflow-hidden rounded-xl text-sm font-semibold cursor-pointer select-none transition-[transform,box-shadow,color] duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 active:scale-[0.98] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-0 bg-gradient-to-r from-[#3b8dee] via-[#ff6b35] to-[#ef3239] text-primary-foreground shadow-[0_10px_28px_-10px_rgba(239,50,57,0.45)] hover:-translate-y-0.5 hover:shadow-[0_14px_32px_-10px_rgba(239,50,57,0.55)]",
        secondary:
          "border-0 bg-white text-[#ef3239] shadow-[inset_0_0_0_2px_#ef3239] hover:-translate-y-0.5 hover:bg-gradient-to-r hover:from-[#3b8dee] hover:via-[#ff6b35] hover:to-[#ef3239] hover:text-white hover:shadow-[0_12px_28px_-10px_rgba(239,50,57,0.4)]",
        outline:
          "border border-border bg-card text-foreground hover:-translate-y-0.5 hover:border-[#ef3239]/30 hover:bg-[#fff5f2] hover:text-[#ef3239] hover:shadow-[0_8px_20px_-10px_rgba(239,50,57,0.2)]",
        ghost: "border-0 text-foreground hover:bg-[#fff5f2] hover:text-[#ef3239]",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-8 text-base",
        pill: "h-11 rounded-full px-8",
        pillLg: "h-[3.25rem] rounded-full px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";
