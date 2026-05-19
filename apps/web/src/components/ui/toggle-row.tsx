import type { ReactNode } from "react";

interface ToggleRowProps {
  label: string;
  description?: string;
  icon: ReactNode;
  checked: boolean;
  onChange: (next: boolean) => void;
}

export function ToggleRow({ label, description, icon, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 bg-paper-card border border-rule-soft rounded-[3px] min-w-[320px]">
      <div className="flex items-center gap-3">
        <span className="w-8 h-8 rounded-[3px] bg-paper-soft border border-rule-soft grid place-items-center text-primary shrink-0 [&>svg]:w-4 [&>svg]:h-4 [&>svg]:stroke-[1.8]">
          {icon}
        </span>
        <div>
          <div className="text-[14px] font-medium text-ink leading-none">{label}</div>
          {description && <div className="text-[12px] text-steel italic mt-0.5">{description}</div>}
        </div>
      </div>
      <Switch checked={checked} onChange={onChange} />
    </div>
  );
}

interface SwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
}

export function Switch({ checked, onChange }: SwitchProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors shrink-0 border-0 cursor-pointer p-0 ${
        checked ? "bg-primary" : "bg-rule"
      }`}
    >
      <span
        className="absolute top-0.5 w-4 h-4 bg-paper-card rounded-full shadow-[0_1px_2px_rgba(31,27,20,0.2)] transition-[left]"
        style={{ left: checked ? "18px" : "2px" }}
      />
    </button>
  );
}
