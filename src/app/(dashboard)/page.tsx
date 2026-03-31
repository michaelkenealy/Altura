import { MetricCard } from "@/components/dashboard/MetricCard";

export const metadata = {
  title: "Dashboard",
};

const metrics = [
  { label: "Total AUM", value: "$2.4B", change: "+3.2%", changeType: "positive" as const, description: "Assets under management" },
  { label: "Active Funds", value: "12", change: "+1", changeType: "positive" as const, description: "Across all strategies" },
  { label: "MTD Return", value: "4.7%", change: "+1.2%", changeType: "positive" as const, description: "Month-to-date performance" },
  { label: "Open Orders", value: "38", change: "-5", changeType: "positive" as const, description: "Pending execution" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--altura-text-primary)" }}>
          Overview
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--altura-text-secondary)" }}>
          Portfolio summary as of today
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      {/* Placeholder content */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="altura-card p-6 h-64 flex items-center justify-center">
          <p style={{ color: "var(--altura-text-muted)" }} className="text-sm">Fund performance chart — coming soon</p>
        </div>
        <div className="altura-card p-6 h-64 flex items-center justify-center">
          <p style={{ color: "var(--altura-text-muted)" }} className="text-sm">Recent activity feed — coming soon</p>
        </div>
      </div>
    </div>
  );
}
