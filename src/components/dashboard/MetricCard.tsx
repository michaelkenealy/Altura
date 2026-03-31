import { TrendingUp, TrendingDown } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  description?: string;
}

export function MetricCard({ label, value, change, changeType, description }: MetricCardProps) {
  const changeColor =
    changeType === "positive"
      ? "var(--status-positive)"
      : changeType === "negative"
      ? "var(--status-negative)"
      : "var(--status-neutral)";

  return (
    <div className="altura-card p-5 flex flex-col gap-3 hover:shadow-card-hover transition-shadow">
      {/* Top row */}
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--altura-text-muted)" }}>
          {label}
        </span>
        <div
          className="flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5"
          style={{
            color: changeColor,
            backgroundColor: `color-mix(in srgb, ${changeColor} 12%, transparent)`,
          }}
        >
          {changeType === "positive" ? (
            <TrendingUp className="h-3 w-3" />
          ) : changeType === "negative" ? (
            <TrendingDown className="h-3 w-3" />
          ) : null}
          {change}
        </div>
      </div>

      {/* Value */}
      <div>
        <div className="metric-value">{value}</div>
        {description && (
          <div className="text-xs mt-0.5" style={{ color: "var(--altura-text-muted)" }}>
            {description}
          </div>
        )}
      </div>

      {/* Gold accent */}
      <div className="gold-accent-line" />
    </div>
  );
}
