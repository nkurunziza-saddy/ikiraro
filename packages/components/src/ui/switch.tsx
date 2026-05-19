import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { cn } from "@/lib/utils";

function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default";
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full border-0 transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:ring-3 aria-invalid:ring-destructive/20 w-[36px] h-[20px] dark:aria-invalid:ring-destructive/40 data-checked:bg-primary data-unchecked:bg-rule-soft data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block rounded-full bg-white ring-0 transition-transform size-[16px] shadow-[0_1px_2px_rgba(31,27,20,0.2)] data-checked:translate-x-[18px] data-unchecked:translate-x-[2px] rtl:data-checked:-translate-x-[18px] rtl:data-unchecked:-translate-x-[2px]"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
