"use client";

import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  description?: string;
  icon?: LucideIcon;
  isLoading?: boolean;
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded ${className}`}
      style={{ backgroundColor: "var(--altura-navy-elevated)" }}
    />
  );
}

export function MetricCard({
  label,
  value,
  change,
  changeType,
  description,
  icon: Icon,
  isLoading = false,
}: MetricCardProps) {
  const changeColor =
    changeType === "positive"
      ? "var(--status-positive)"
      : changeType === "negative"
      ? "var(--status-negative)"
      : "var(--status-neutral)";

  if (isLoading) {
    return (
      <div className="altura-card p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <Skeleton className="h-7 w-32 mt-1" />
        <Skeleton className="h-0.5 w-12" />
      </div>
    );
  }

  return (
    <div className="altura-card p-5 flex flex-col gap-3 hover:shadow-card-hover transition-shadow">
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {Icon && (
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md flex-shrink-0"
              style={{ backgroundColor: "rgba(197,165,114,0.1)" }}
            >
              <Icon className="h-3.5 w-3.5" style={{ color: "var(--altura-gold)" }} />
            </div>
          )}
          <span
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: "var(--altura-text-muted)" }}
          >
            {label}
          </span>
        </div>
        <div
          className="flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 flex-shrink-0"
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
