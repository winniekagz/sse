"use client";

type KpiValueProps = {
  value: string;
  unit?: string;
};

export function KpiValue({ value, unit }: KpiValueProps) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-3xl font-semibold text-slate-950">{value}</span>
      {unit ? <span className="text-sm text-slate-500">{unit}</span> : null}
    </div>
  );
}
