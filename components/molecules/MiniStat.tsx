"use client";

type MiniStatProps = {
  label: string;
  value: string;
};

export function MiniStat({ label, value }: MiniStatProps) {
  return (
    <div className="flex items-center justify-between text-xs text-slate-500">
      <span>{label}</span>
      <span className="font-medium text-slate-700">{value}</span>
    </div>
  );
}
