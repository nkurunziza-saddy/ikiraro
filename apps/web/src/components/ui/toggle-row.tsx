import type { ReactNode } from "react";
import { Switch } from "@ikiraro/components";

interface ToggleRowProps {
  label: string;
  description?: string;
  icon: ReactNode;
  checked: boolean;
  onChange: (next: boolean) => void;
}

export function ToggleRow({ label, description, icon, checked, onChange }: ToggleRowProps) {
  return (
    <div className="bg-paper-card border-rule-soft flex items-center justify-between gap-4 rounded-[3px] border px-4 py-3 min-w-[320px]">
      <div className="flex items-center gap-3">
        <span className="bg-paper-soft border-rule-soft grid h-8 w-8 shrink-0 place-items-center rounded-[3px] border text-primary [&>svg]:h-4 [&>svg]:w-4 [&>svg]:stroke-[1.8]">
          {icon}
        </span>
        <div>
          <div className="text-ink text-[14px] font-medium leading-none">{label}</div>
          {description && <div className="text-steel mt-0.5 text-[12px] italic">{description}</div>}
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
