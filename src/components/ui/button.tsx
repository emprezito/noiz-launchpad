import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-base font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-noiz-md hover:shadow-noiz-lg hover:-translate-y-0.5 active:translate-y-0",
        destructive:
          "bg-destructive text-destructive-foreground shadow-noiz-md hover:shadow-noiz-lg hover:bg-destructive/90",
        outline:
          "border-2 border-border bg-background hover:bg-muted hover:border-primary/30",
        secondary:
          "bg-secondary text-secondary-foreground shadow-noiz-md hover:shadow-noiz-lg hover:-translate-y-0.5",
        ghost: 
          "hover:bg-muted hover:text-foreground",
        link: 
          "text-primary underline-offset-4 hover:underline",
        hero: 
          "gradient-primary text-primary-foreground shadow-noiz-lg hover:shadow-noiz-xl hover:-translate-y-1 active:translate-y-0",
        heroOutline:
          "bg-card text-foreground shadow-noiz-lg hover:shadow-noiz-xl hover:-translate-y-1 active:translate-y-0",
        cta:
          "bg-card text-primary font-bold shadow-noiz-xl hover:scale-105 active:scale-100",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-lg px-4 text-sm",
        lg: "h-14 rounded-xl px-8 text-lg",
        xl: "h-16 rounded-2xl px-10 text-xl",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
