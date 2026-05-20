import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-[15px] font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-[1px] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-on-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_1px_0_var(--primary-deep),0_6px_14px_-4px_rgba(180,61,17,0.35)] hover:bg-primary-deep hover:-translate-y-[1px] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_1px_0_#8e2d0e,0_8px_18px_-4px_rgba(180,61,17,0.45)]",
        outline:
          "border-rule bg-background text-ink hover:border-ink aria-expanded:bg-muted aria-expanded:text-foreground",
        secondary:
          "bg-white/60 text-ink backdrop-blur-md border-rule hover:bg-paper-card hover:border-ink",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary border-b border-current pb-0.5 rounded-none hover:text-primary-deep",
        dark: "bg-ink text-on-dark hover:bg-ink-soft",
      },
      size: {
        default: "h-[42px] px-[22px] gap-2.5",
        xs: "h-6 gap-1 px-2 text-xs",
        sm: "h-8 gap-1.5 px-3 text-[14px]",
        lg: "h-12 gap-2.5 px-8 text-base",
        icon: "size-10",
        "icon-xs": "size-6",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
