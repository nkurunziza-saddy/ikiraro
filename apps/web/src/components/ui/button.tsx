import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-sans font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-none",
        outline:
          "border border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground rounded-none",
        link: "text-primary underline-offset-[6px] hover:underline",
        ghost: "hover:text-primary/70",
      },
      size: {
        default: "px-[24px] py-[14px] text-[15px] tracking-[0.05em] uppercase",
        sm: "px-[16px] py-[8px] text-[13px] tracking-[0.05em] uppercase",
        lg: "px-[32px] py-[18px] text-[16px] tracking-[0.05em] uppercase",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  render?: React.ReactElement<any>;
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, render, ...props }, ref) => {
    if (render) {
      return React.cloneElement(render, {
        className: cn(buttonVariants({ variant, size, className }), render.props.className),
        ref,
        ...props,
      });
    }
    return (
      <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";
export { Button, buttonVariants };
