import React from "react";

interface MetricBreakdownCardProps {
  title: string;
  unit?: string;
  values: Array<number | null | undefined>; // M1..M5
  avg: number | null;
  n: number;
  subtitle?: string;
  className?: string;
}

const MetricBreakdownCard: React.FC<MetricBreakdownCardProps> = ({
  title, unit, values, avg, n, subtitle, className = ""
}) => {
  const fmt = (v: any) =>
    v == null || Number.isNaN(Number(v)) ? "—" : Number(v).toFixed(2).replace(/\.00$/, "");

  return (
    <div className={`rounded-2xl border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <div className="flex items-baseline justify-between">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-gray-500">n={n}</div>
      </div>
      {subtitle ? <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div> : null}

      <div className="mt-3 space-y-1 text-sm">
        {values.map((v, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-1.5">
            <span>M{i + 1}</span>
            <span className="font-medium">
              {fmt(v)}{unit ? ` ${unit}` : ""}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="font-medium">Moyenne</span>
        <span className="font-semibold">
          {avg == null ? "—" : fmt(avg)}{unit ? ` ${unit}` : ""}
        </span>
      </div>
    </div>
  );
};

export default MetricBreakdownCard;
