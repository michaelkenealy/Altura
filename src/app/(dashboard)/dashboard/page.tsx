"use client";

import { MetricCard } from "@/components/dashboard/MetricCard";
import { useFundSummary } from "@/hooks/useFunds";
import { useFunds } from "@/hooks/useFunds";
import { MOCK_ACTIVITY } from "@/lib/mock-data";
import { formatCurrency, formatPercent, formatDate } from "@/lib/utils";
import { useFundStore } from "@/stores/fundStore";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Activity,
  Briefcase,
  Clock,
} from "lucide-react";

export const metadata = { title: "Dashboard" };

const activityTypeConfig = {
  trade: { label: "Trade", color: "var(--status-info)" },
  subscription: { label: "Subscription", color: "var(--status-positive)" },
  redemption: { label: "Redemption", color: "var(--status-warning)" },
  corporate_action: { label: "Corp. Action", color: "var(--altura-gold)" },
  compliance: { label: "Compliance", color: "var(--status-neutral)" },
};

const statusConfig = {
  completed: { color: "var(--status-positive)", label: "Done" },
  pending: { color: "var(--status-warning)", label: "Pending" },
  failed: { color: "var(--status-negative)", label: "Failed" },
};

export default function DashboardPage() {
  const { data: summary, isLoading: summaryLoading } = useFundSummary();
  const { data: funds = [], isLoading: fundsLoading } = useFunds();
  const { selectedFundId } = useFundStore();

  const metrics = [
    {
      label: "Total AUM (NZD)",
      value: summary ? formatCurrency(summary.total_aum, { compact: true }) : "—",
      change: "+3.2%",
      changeType: "positive" as const,
      description: "Assets under management",
    },
    {
      label: "Active Funds",
      value: summary ? String(summary.active_funds) : "—",
      change: `${summary?.total_funds ?? "—"} total`,
      changeType: "neutral" as const,
      description: "Across all strategies",
    },
    {
      label: "Total Holdings",
      value: summary ? String(summary.total_holdings) : "—",
      change: "across all funds",
      changeType: "neutral" as const,
      description: "Individual positions",
    },
    {
      label: "Daily P&L (NZD)",
      value: summary ? formatCurrency(summary.daily_pnl, { compact: true }) : "—",
      change: summary ? formatPercent(summary.daily_pnl_pct) : "—",
      changeType: summary && summary.daily_pnl >= 0 ? ("positive" as const) : ("negative" as const),
      description: "Mark-to-market today",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ color: "var(--altura-text-primary)" }}
          >
            Overview
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--altura-text-secondary)" }}>
            Portfolio summary as of{" "}
            <span style={{ color: "var(--altura-gold)" }}>
              {formatDate(new Date(), "long")}
            </span>
          </p>
        </div>
        <div
          className="text-xs rounded-full px-3 py-1 font-medium"
          style={{
            backgroundColor: "rgba(34,197,94,0.1)",
            color: "var(--status-positive)",
            border: "1px solid rgba(34,197,94,0.2)",
          }}
        >
          Live · NZT 16:00
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      {/* Fund Table + Activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Fund Overview Table */}
        <div className="lg:col-span-2 altura-card">
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid var(--altura-border)" }}
          >
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" style={{ color: "var(--altura-gold)" }} />
              <span
                className="text-sm font-semibold"
                style={{ color: "var(--altura-text-primary)" }}
              >
                Fund Overview
              </span>
            </div>
            <Link
              href="/dashboard/funds"
              className="flex items-center gap-1 text-xs hover:opacity-80 transition-opacity"
              style={{ color: "var(--altura-gold)" }}
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          {fundsLoading ? (
            <div className="p-8 flex items-center justify-center">
              <div
                className="text-sm animate-pulse"
                style={{ color: "var(--altura-text-muted)" }}
              >
                Loading funds…
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--altura-border)" }}>
                    {["Fund", "Strategy", "AUM (NZD)", "NAV", "Status"].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left font-medium"
                        style={{
                          color: "var(--altura-text-muted)",
                          fontSize: "0.7rem",
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {funds.map((fund, i) => (
                    <tr
                      key={fund.id}
                      className="transition-colors hover:bg-white/[0.02] cursor-pointer"
                      style={{
                        borderBottom:
                          i < funds.length - 1 ? "1px solid var(--altura-border)" : "none",
                      }}
                      onClick={() => {}}
                    >
                      <td className="px-5 py-3">
                        <div>
                          <div
                            className="font-medium text-sm"
                            style={{ color: "var(--altura-text-primary)" }}
                          >
                            {fund.name}
                          </div>
                          <div
                            className="text-xs font-mono mt-0.5"
                            style={{ color: "var(--altura-gold)" }}
                          >
                            {fund.ticker}
                          </div>
                        </div>
                      </td>
                      <td
                        className="px-5 py-3 text-xs"
                        style={{ color: "var(--altura-text-secondary)" }}
                      >
                        {fund.strategy}
                      </td>
                      <td
                        className="px-5 py-3 font-mono text-sm font-medium"
                        style={{ color: "var(--altura-text-primary)" }}
                      >
                        {formatCurrency(fund.aum, { compact: true })}
                      </td>
                      <td
                        className="px-5 py-3 font-mono text-sm"
                        style={{ color: "var(--altura-text-primary)" }}
                      >
                        {fund.nav.toFixed(4)}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="text-xs rounded-full px-2 py-0.5 font-medium capitalize"
                          style={{
                            color:
                              fund.status === "active"
                                ? "var(--status-positive)"
                                : fund.status === "soft_closed"
                                ? "var(--status-warning)"
                                : "var(--status-neutral)",
                            backgroundColor:
                              fund.status === "active"
                                ? "rgba(34,197,94,0.1)"
                                : fund.status === "soft_closed"
                                ? "rgba(245,158,11,0.1)"
                                : "rgba(148,163,184,0.1)",
                          }}
                        >
                          {fund.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="altura-card">
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid var(--altura-border)" }}
          >
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" style={{ color: "var(--altura-gold)" }} />
              <span
                className="text-sm font-semibold"
                style={{ color: "var(--altura-text-primary)" }}
              >
                Recent Activity
              </span>
            </div>
          </div>

          <div className="divide-y" style={{ borderColor: "var(--altura-border)" }}>
            {MOCK_ACTIVITY.slice(0, 7).map((item) => {
              const typeConf = activityTypeConfig[item.type];
              const statusConf = statusConfig[item.status];
              return (
                <div key={item.id} className="px-5 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: typeConf.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-xs font-medium"
                          style={{ color: typeConf.color }}
                        >
                          {typeConf.label}
                        </span>
                        <span
                          className="text-xs font-mono"
                          style={{ color: "var(--altura-gold)" }}
                        >
                          {item.fund_name}
                        </span>
                      </div>
                      <p
                        className="text-xs mt-0.5 leading-relaxed"
                        style={{ color: "var(--altura-text-secondary)" }}
                      >
                        {item.description}
                      </p>
                      {item.amount && (
                        <p
                          className="text-xs font-mono mt-0.5 font-medium"
                          style={{ color: "var(--altura-text-primary)" }}
                        >
                          {formatCurrency(item.amount, { compact: true })}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Clock
                          className="h-3 w-3"
                          style={{ color: "var(--altura-text-muted)" }}
                        />
                        <span
                          className="text-xs"
                          style={{ color: "var(--altura-text-muted)" }}
                        >
                          {new Date(item.timestamp).toLocaleTimeString("en-NZ", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span
                          className="text-xs rounded-full px-1.5 py-0.5"
                          style={{
                            color: statusConf.color,
                            backgroundColor: `color-mix(in srgb, ${statusConf.color} 10%, transparent)`,
                          }}
                        >
                          {statusConf.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MTD / YTD summary bar */}
      {summary && (
        <div className="altura-card p-5">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { label: "MTD Return", value: formatPercent(summary.mtd_return), positive: summary.mtd_return >= 0 },
              { label: "YTD Return", value: formatPercent(summary.ytd_return), positive: summary.ytd_return >= 0 },
              { label: "Daily P&L", value: formatCurrency(summary.daily_pnl, { compact: true }), positive: summary.daily_pnl >= 0 },
              { label: "Inception Date", value: "Mar 2018", positive: true },
            ].map(({ label, value, positive }) => (
              <div key={label}>
                <div
                  className="text-xs font-medium uppercase tracking-wider mb-1"
                  style={{ color: "var(--altura-text-muted)" }}
                >
                  {label}
                </div>
                <div
                  className="text-xl font-semibold flex items-center gap-1"
                  style={{
                    color: positive ? "var(--status-positive)" : "var(--status-negative)",
                  }}
                >
                  {positive ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
