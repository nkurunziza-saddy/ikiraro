import * as React from "react";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cn } from "@/lib/utils";

type TabsVariant = "pill" | "line";

const TabsRootCtx = React.createContext<{ activeValue?: string }>({ activeValue: undefined });
const TabsListCtx = React.createContext<{ variant: TabsVariant; layoutId: string }>({
  variant: "pill",
  layoutId: "",
});

function Tabs({
  className,
  orientation = "horizontal",
  defaultValue,
  value: valueProp,
  onValueChange,
  ...props
}: TabsPrimitive.Root.Props) {
  const [activeValue, setActiveValue] = React.useState<string | undefined>(
    valueProp ?? defaultValue,
  );

  React.useEffect(() => {
    if (valueProp !== undefined) setActiveValue(valueProp);
  }, [valueProp]);

  const handleChange = React.useCallback(
    (val: any, eventDetails: any) => {
      setActiveValue(val as string);
      onValueChange?.(val, eventDetails);
    },
    [onValueChange],
  );

  return (
    <TabsRootCtx.Provider value={{ activeValue }}>
      <TabsPrimitive.Root
        data-slot="tabs"
        orientation={orientation}
        className={cn(
          "group/tabs flex data-[orientation=horizontal]:flex-col gap-4 w-full",
          className,
        )}
        value={activeValue}
        onValueChange={handleChange}
        {...props}
      />
    </TabsRootCtx.Provider>
  );
}

function TabsList({
  className,
  variant = "pill",
  ...props
}: TabsPrimitive.List.Props & { variant?: TabsVariant }) {
  const id = React.useId();

  return (
    <TabsListCtx.Provider value={{ variant, layoutId: `tabs-indicator-${id}` }}>
      <TabsPrimitive.List
        data-slot="tabs-list"
        className={cn(
          "inline-flex items-center shrink-0",
          variant === "pill" && [
            "w-fit p-1 bg-muted border border-border rounded-md gap-1",
            "data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch",
          ],
          variant === "line" && [
            "border-border",
            "data-[orientation=horizontal]:w-full data-[orientation=horizontal]:border-b",
            "data-[orientation=vertical]:flex-col data-[orientation=vertical]:border-s data-[orientation=vertical]:h-full",
          ],
          className,
        )}
        {...props}
      />
    </TabsListCtx.Provider>
  );
}

function TabsTrigger({ children, className, value, ...props }: TabsPrimitive.Tab.Props) {
  const { activeValue } = React.useContext(TabsRootCtx);
  const { variant } = React.useContext(TabsListCtx);
  const isActive = value !== undefined && value === activeValue;

  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      value={value}
      className={cn(
        "relative inline-flex items-center gap-2 select-none transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 text-xs font-medium whitespace-nowrap active:scale-[0.98]",
        isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        variant === "pill" && [
          "h-7 px-3 rounded-sm justify-center",
          "data-[orientation=vertical]:justify-start data-[orientation=vertical]:h-8",
        ],
        variant === "line" && [
          "py-2 justify-center",
          "data-[orientation=horizontal]:px-4 data-[orientation=horizontal]:pb-2.5 data-[orientation=horizontal]:pt-2",
          "data-[orientation=vertical]:justify-start data-[orientation=vertical]:px-4 data-[orientation=vertical]:py-2",
        ],
        className,
      )}
      {...props}
    >
      {isActive && (
        <span
          className={cn(
            "absolute z-0 transition-all duration-[180ms] ease",
            variant === "pill" && [
              "inset-0 bg-card border border-border rounded-xs",
              "group-data-[orientation=vertical]/tabs:bg-muted group-data-[orientation=vertical]/tabs:border-transparent",
            ],
            variant === "line" && [
              "bg-foreground",
              "data-[orientation=horizontal]:inset-x-0 data-[orientation=horizontal]:bottom-[-1px] data-[orientation=horizontal]:h-0.5",
              "data-[orientation=vertical]:inset-y-0 data-[orientation=vertical]:start-[-1px] data-[orientation=vertical]:w-0.5",
            ],
          )}
        />
      )}
      <span className="relative z-10">{children}</span>
    </TabsPrimitive.Tab>
  );
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-xs/relaxed outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
