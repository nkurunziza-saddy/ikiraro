import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import type * as React from "react";

import { cn } from "@/lib/utils";

function TooltipProvider({ delay = 400, ...props }: TooltipPrimitive.Provider.Props) {
  return <TooltipPrimitive.Provider data-slot="tooltip-provider" delay={delay} {...props} />;
}

function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
  className,
  side = "top",
  sideOffset = 8,
  align = "center",
  alignOffset = 0,
  children,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<TooltipPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            "z-50 inline-flex w-fit max-w-xs origin-(--transform-origin) items-center rounded-md border border-border bg-card px-2.5 py-1.5 text-[11px] font-normal tracking-[0.01em] text-foreground transition-[opacity,transform,scale] duration-[150ms] ease-out",
            "data-ending-style:opacity-0 data-ending-style:scale-[0.98] data-starting-style:opacity-0 data-starting-style:scale-[0.98]",
            className,
          )}
          {...props}
        >
          {children}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

/** Convenience wrapper — pass `content` and the single child element becomes the trigger. */
function Tooltip({
  children,
  content,
  side = "top",
  sideOffset = 8,
  align = "center",
  ...props
}: TooltipPrimitive.Root.Props & {
  content?: React.ReactNode;
  side?: TooltipPrimitive.Positioner.Props["side"];
  sideOffset?: number;
  align?: TooltipPrimitive.Positioner.Props["align"];
}) {
  if (content !== undefined) {
    return (
      <TooltipPrimitive.Root data-slot="tooltip" {...props}>
        <TooltipPrimitive.Trigger
          data-slot="tooltip-trigger"
          render={children as React.ReactElement}
        />
        <TooltipContent side={side} sideOffset={sideOffset} align={align}>
          {content}
        </TooltipContent>
      </TooltipPrimitive.Root>
    );
  }
  return (
    <TooltipPrimitive.Root data-slot="tooltip" {...props}>
      {children}
    </TooltipPrimitive.Root>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
