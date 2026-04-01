"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { DataTable, fmtCurrency, fmtNumber, PnlCell, TradeBadge, StatusBadge } from "@/components/data-table/DataTable";
import { useFunds } from "@/hooks/useFunds";
import { useHoldings } from "@/hooks/useHoldings";
import { useFundSummary } from "@/hooks/useFundSummary";
import { useTrades } from "@/hooks/useTrades";
import { usePortfolio } from "@/hooks/usePortfolio";
import type { ColumnDef } from "@tanstack/react-table";
import type { Holding, Trade } from "@/lib/mock-data";

const ASSET_COLORS: Record<string, string> = {
  Stocks: "#C5A572",
  "Fixed Income": "#3B82F6",
  Hedges: "#8B5CF6",
  Cash: "#22C55E",
};

const holdingColumns: ColumnDef<Holding>[] = [
  {
    id: "security",
    header: "Security",
    accessorFn: (r) => r.security.name,
    cell: ({ row }) => (
      <div>
        <div className="font-medium" style={{ color: "var(--altura-text-primary)" }}>
          {row.original.security.name}
        </div>
        <div className="text-xs mt-0.5" style={{ color: "var(--altura-text-muted)" }}>
          {row.original.security.asset_type.name} · {row.original.security.exchange}
        </div>
      </div>
    ),
  },
  {
    id: "ticker",
    header: "Ticker",
    accessorFn: (r) => r.security.ticker,
    cell: ({ row }) => (
      <span
        className="font-mono text-xs font-medium rounded px-1.5 py-0.5"
        style={{ backgroundColor: "rgba(197,165,114,0.1)", color: "var(--altura-gold)" }}
      >
        {row.original.security.ticker}
      </span>
    ),
  },
  {
    id: "qty",
    header: "Qty",
    accessorFn: (r) => r.quantity,
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.quantity.toLocaleString("en-NZ")}</span>
    ),
  },
  {
    id: "last_price",
    header: "Last Price",
    accessorFn: (r) => r.last_price,
    cell: ({ row }) => (
      <span className="tabular-nums">{fmtNumber(row.original.last_price)}</span>
    ),
  },
  {
    id: "weight",
    header: "% Fund",
    accessorFn: (r) => r.weight_pct,
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.weight_pct.toFixed(2)}%</span>
    ),
  },
  {
    id: "value_nzd",
    header: "Value (NZD)",
    accessorFn: (r) => r.market_value_nzd,
    cell: ({ row }) => (
      <span className="tabular-nums font-medium">{fmtCurrency(row.original.market_value_nzd, true)}</span>
    ),
  },
  {
    id: "pnl",
    header: "P&L %",
    accessorFn: (r) => r.pnl_pct,
    cell: ({ row }) => <PnlCell value={row.original.pnl_pct} />,
  },
];

const tradeColumns: ColumnDef<Trade>[] = [
  {
    id: "type",
    header: "Type",
    cell: ({ row }) => <TradeBadge type={row.original.trade_type} />,
  },
  {
    id: "security",
    header: "Security",
    cell: ({ row }) => <span className="font-medium">{row.original.security.ticker}</span>,
  },
  {
    id: "qty",
    header: "Qty",
    accessorFn: (r) => r.quantity,
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.quantity.toLocaleString("en-NZ")}</span>
    ),
  },
  {
    id: "price",
    header: "Price",
    cell: ({ row }) => (
      <span className="tabular-nums">{fmtNumber(row.original.price)}</span>
    ),
  },
  {
    id: "value",
    header: "Value (NZD)",
    accessorFn: (r) => r.trade_value_nzd,
    cell: ({ row }) => (
      <span className="tabular-nums">{fmtCurrency(row.original.trade_value_nzd, true)}</span>
    ),
  },
  {
    id: "date",
    header: "Trade Date",
    cell: ({ row }) => (
      <span style={{ color: "var(--altura-text-muted)" }}>{row.original.trade_date}</span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const s = row.original.status;
      const color =
        s === "settled"
          ? "var(--status-positive)"
          : s === "pending"
          ? "var(--status-warning)"
          : "var(--status-negative)";
      return (
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize"
          style={{ color, backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)` }}
        >
          {s}
        </span>
      );
    },
  },
  {
    id: "broker",
    header: "Broker",
    cell: ({ row }) => (
      <span style={{ color: "var(--altura-text-muted)" }}>{row.original.broker}</span>
    ),
  },
];

export default function FundDetailPage() {
  const params = useParams();
  const router = useRouter();
  const fundId = params.id as string;

  const { data: funds = [] } = useFunds();
  const { data: summary, isLoading: summaryLoading } = useFundSummary(fundId);
  const { data: holdings = [], isLoading: holdingsLoading } = useHoldings(fundId);
  const { data: trades = [], isLoading: tradesLoading } = useTrades(fundId);
  const { data: groups = [] } = usePortfolio(fundId);

  const fund = funds.find((f) => f.id === fundId);

  const pieData = groups.map((g) => ({
    name: g.asset_type.name,
    value: g.total_value_nzd,
    pct: g.weight_pct,
  }));

  if (!fund && funds.length > 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ color: "var(--altura-text-muted)" }}>Fund not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back + Header */}
      <div>
        <button
          onClick={() => router.push("/dashboard/funds")}
          className="flex items-center gap-1.5 text-sm mb-3 transition-colors"
          style={{ color: "var(--altura-text-muted)" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--altura-gold)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--altura-text-muted)")}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All Funds
        </button>

        <div className="flex items-center gap-4 flex-wrap">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl font-bold text-lg flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #C5A572 0%, #B08A52 100%)", color: "var(--altura-navy)" }}
          >
            {fund?.code?.slice(0, 1) ?? "?"}
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--altura-text-primary)" }}>
                {fund?.name ?? "Loading..."}
              </h1>
              {fund && (
                <>
                  <span
                    className="font-mono text-sm font-semibold rounded px-2 py-0.5"
                    style={{ backgroundColor: "rgba(197,165,114,0.12)", color: "var(--altura-gold)" }}
                  >
                    {fund.code}
                  </span>
                  <StatusBadge status={fund.status} />
                </>
              )}
            </div>
            {fund && (
              <p className="text-sm mt-0.5" style={{ color: "var(--altura-text-secondary)" }}>
                {fund.strategy} · {fund.currency} · Inception{" "}
                {new Date(fund.inception_date).toLocaleDateString("en-NZ", {
                  year: "numeric",
                  month: "long",
                })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Fund AUM",
            value: summary ? fmtCurrency(summary.total_aum_nzd, true) : "—",
          },
          {
            label: "Holdings",
            value: summary ? String(summary.num_holdings) : "—",
          },
          {
            label: "Daily P&L",
            value: summary ? fmtCurrency(summary.daily_pnl, true) : "—",
            color: summary
              ? summary.daily_pnl >= 0
                ? "var(--status-positive)"
                : "var(--status-negative)"
              : undefined,
            icon: summary
              ? summary.daily_pnl >= 0
                ? ArrowUpRight
                : ArrowDownRight
              : undefined,
          },
          {
            label: "YTD Return",
            value: summary
              ? `${summary.ytd_return >= 0 ? "+" : ""}${summary.ytd_return.toFixed(2)}%`
              : "—",
            color: summary
              ? summary.ytd_return >= 0
                ? "var(--status-positive)"
                : "var(--status-negative)"
              : undefined,
          },
        ].map((item) => (
          <div key={item.label} className="altura-card px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--altura-text-muted)" }}>
              {item.label}
            </p>
            <div className="flex items-center gap-1 mt-1">
              {item.icon && <item.icon className="h-4 w-4" style={{ color: item.color }} />}
              <p
                className="text-lg font-semibold tabular-nums"
                style={{ color: item.color ?? "var(--altura-text-primary)" }}
              >
                {summaryLoading ? "..." : item.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Pie chart + Performance */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Allocation pie */}
        <div className="lg:col-span-2 altura-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider mb-4" style={{ color: "var(--altura-text-muted)" }}>
            Asset Allocation
          </p>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={ASSET_COLORS[entry.name] ?? "#64748B"}
                      opacity={0.9}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0F1F3D",
                    border: "1px solid #1A2F55",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "#F1F5F9",
                  }}
                  formatter={(v, name) => [
                    fmtCurrency(Number(v), true),
                    String(name),
                  ]}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span style={{ color: "var(--altura-text-secondary)", fontSize: 11 }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-48 items-center justify-center">
              <p className="text-sm" style={{ color: "var(--altura-text-muted)" }}>No data</p>
            </div>
          )}
        </div>

        {/* Performance metrics */}
        <div className="lg:col-span-3 altura-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider mb-4" style={{ color: "var(--altura-text-muted)" }}>
            Performance Summary
          </p>
          {summary ? (
            <div className="space-y-3">
              {[
                { label: "MTD Return", value: summary.mtd_return, format: "pct" },
                { label: "YTD Return", value: summary.ytd_return, format: "pct" },
                { label: "Daily P&L", value: summary.daily_pnl_pct, format: "pct" },
                { label: "Cash Balance", value: summary.cash_balance, format: "ccy" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between py-2 border-b"
                  style={{ borderColor: "var(--altura-border)" }}
                >
                  <span className="text-sm" style={{ color: "var(--altura-text-secondary)" }}>
                    {item.label}
                  </span>
                  <span
                    className="font-medium tabular-nums text-sm"
                    style={{
                      color:
                        item.format === "pct"
                          ? item.value >= 0
                            ? "var(--status-positive)"
                            : "var(--status-negative)"
                          : "var(--altura-text-primary)",
                    }}
                  >
                    {item.format === "pct"
                      ? `${item.value >= 0 ? "+" : ""}${item.value.toFixed(2)}%`
                      : fmtCurrency(item.value, true)}
                  </span>
                </div>
              ))}

              {/* Allocation breakdown */}
              <div className="pt-1">
                <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--altura-text-muted)" }}>
                  Allocation Breakdown
                </p>
                {pieData.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between py-1.5 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: ASSET_COLORS[item.name] ?? "#64748B" }}
                      />
                      <span style={{ color: "var(--altura-text-secondary)" }}>{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="tabular-nums text-xs" style={{ color: "var(--altura-text-muted)" }}>
                        {item.pct.toFixed(1)}%
                      </span>
                      <span className="tabular-nums font-medium" style={{ color: "var(--altura-text-primary)" }}>
                        {fmtCurrency(item.value, true)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between py-2 border-b" style={{ borderColor: "var(--altura-border)" }}>
                  <div className="h-3 w-24 rounded animate-pulse" style={{ backgroundColor: "var(--altura-navy-elevated)" }} />
                  <div className="h-3 w-16 rounded animate-pulse" style={{ backgroundColor: "var(--altura-navy-elevated)" }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Holdings table */}
      <div className="altura-card overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--altura-border)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--altura-text-primary)" }}>
            Holdings ({holdings.length})
          </h2>
        </div>
        <DataTable columns={holdingColumns} data={holdings} isLoading={holdingsLoading} compact />
      </div>

      {/* Recent trades */}
      <div className="altura-card overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--altura-border)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--altura-text-primary)" }}>
            Recent Trades ({trades.length})
          </h2>
        </div>
        <DataTable columns={tradeColumns} data={trades} isLoading={tradesLoading} compact />
      </div>
    </div>
  );
}
