"use client";

import { useRouter } from "next/navigation";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DollarSign, Briefcase, BarChart3, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DataTable, fmtCurrency, StatusBadge, TradeBadge } from "@/components/data-table/DataTable";
import { useFunds } from "@/hooks/useFunds";
import { useAllFundSummaries } from "@/hooks/useFundSummary";
import { useTrades } from "@/hooks/useTrades";
import { DASHBOARD_METRICS, AUM_HISTORY } from "@/lib/mock-data";
import type { ColumnDef } from "@tanstack/react-table";
import type { MockFund, FundSummary, Trade } from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// AUM Chart
// ---------------------------------------------------------------------------

function AumChart() {
  const lastAum = AUM_HISTORY[AUM_HISTORY.length - 1]?.aum ?? 0;

  return (
    <div className="altura-card p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--altura-text-muted)" }}>
            Total AUM — 30 Day Trend
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums" style={{ color: "var(--altura-text-primary)" }}>
            {fmtCurrency(lastAum, true)}
          </p>
        </div>
        <span className="flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5"
          style={{ color: "var(--status-positive)", backgroundColor: "rgba(34,197,94,0.1)" }}>
          <TrendingUp className="h-3 w-3" /> NZD
        </span>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={AUM_HISTORY} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="aumGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#C5A572" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#C5A572" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,47,85,0.8)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#64748B" }}
            tickLine={false}
            axisLine={false}
            interval={4}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#64748B" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${(v / 1e6).toFixed(0)}M`}
            width={50}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0F1F3D",
              border: "1px solid #1A2F55",
              borderRadius: 8,
              fontSize: 12,
              color: "#F1F5F9",
            }}
            formatter={(v) => [fmtCurrency(Number(v), true), "AUM"]}
            labelStyle={{ color: "#94A3B8", marginBottom: 4 }}
            cursor={{ stroke: "rgba(197,165,114,0.3)", strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="aum"
            stroke="#C5A572"
            strokeWidth={1.5}
            fill="url(#aumGrad)"
            dot={false}
            activeDot={{ r: 4, fill: "#C5A572", stroke: "#0F1F3D", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fund Overview Table
// ---------------------------------------------------------------------------

function FundOverviewTable() {
  const router = useRouter();
  const { data: funds = [], isLoading: fundsLoading } = useFunds();
  const { data: summaries = [], isLoading: summaryLoading } = useAllFundSummaries();

  const isLoading = fundsLoading || summaryLoading;

  const rows = funds.map((fund) => {
    const summary = summaries.find((s) => s.fund_id === fund.id);
    return { fund, summary };
  });

  type Row = (typeof rows)[number];

  const columns: ColumnDef<Row>[] = [
    {
      accessorKey: "fund.name",
      header: "Fund",
      cell: ({ row }) => (
        <div>
          <div className="font-medium" style={{ color: "var(--altura-text-primary)" }}>
            {row.original.fund.name}
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--altura-text-muted)" }}>
            {row.original.fund.strategy}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "fund.code",
      header: "Code",
      cell: ({ row }) => (
        <span
          className="font-mono text-xs font-medium rounded px-1.5 py-0.5"
          style={{ backgroundColor: "rgba(197,165,114,0.1)", color: "var(--altura-gold)" }}
        >
          {row.original.fund.code}
        </span>
      ),
    },
    {
      id: "aum",
      header: "AUM (NZD)",
      accessorFn: (r) => r.summary?.total_aum_nzd ?? 0,
      cell: ({ row }) => (
        <span className="tabular-nums font-medium">
          {fmtCurrency(row.original.summary?.total_aum_nzd ?? 0, true)}
        </span>
      ),
    },
    {
      id: "holdings",
      header: "Holdings",
      accessorFn: (r) => r.summary?.num_holdings ?? 0,
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original.summary?.num_holdings ?? "—"}</span>
      ),
    },
    {
      id: "daily_pnl",
      header: "Daily P&L",
      accessorFn: (r) => r.summary?.daily_pnl ?? 0,
      cell: ({ row }) => {
        const pnl = row.original.summary?.daily_pnl ?? 0;
        const pct = row.original.summary?.daily_pnl_pct ?? 0;
        const color = pnl >= 0 ? "var(--status-positive)" : "var(--status-negative)";
        const Icon = pnl >= 0 ? ArrowUpRight : ArrowDownRight;
        return (
          <div className="flex items-center gap-1" style={{ color }}>
            <Icon className="h-3.5 w-3.5" />
            <span className="tabular-nums font-medium">{fmtCurrency(Math.abs(pnl), true)}</span>
            <span className="text-xs">({Math.abs(pct).toFixed(2)}%)</span>
          </div>
        );
      },
    },
    {
      id: "mtd",
      header: "MTD",
      accessorFn: (r) => r.summary?.mtd_return ?? 0,
      cell: ({ row }) => {
        const v = row.original.summary?.mtd_return ?? 0;
        return (
          <span
            className="tabular-nums font-medium"
            style={{ color: v >= 0 ? "var(--status-positive)" : "var(--status-negative)" }}
          >
            {v >= 0 ? "+" : ""}{v.toFixed(2)}%
          </span>
        );
      },
    },
    {
      accessorKey: "fund.status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.fund.status} />,
    },
  ];

  return (
    <div className="altura-card overflow-hidden">
      <div className="px-5 py-4 border-b" style={{ borderColor: "var(--altura-border)" }}>
        <h2 className="text-sm font-semibold" style={{ color: "var(--altura-text-primary)" }}>
          Fund Overview
        </h2>
      </div>
      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        onRowClick={(row) => router.push(`/dashboard/funds/${row.fund.id}`)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recent Activity
// ---------------------------------------------------------------------------

function RecentActivity() {
  const { data: trades = [], isLoading } = useTrades();

  const columns: ColumnDef<Trade>[] = [
    {
      id: "fund",
      header: "Fund",
      cell: ({ row }) => {
        const fundMap: Record<string, string> = {
          "f-nzg": "NZG",
          "f-pif": "PIF",
          "f-ghf": "GHF",
        };
        return (
          <span
            className="font-mono text-xs font-medium rounded px-1.5 py-0.5"
            style={{ backgroundColor: "rgba(197,165,114,0.1)", color: "var(--altura-gold)" }}
          >
            {fundMap[row.original.fund_id] ?? row.original.fund_id}
          </span>
        );
      },
    },
    {
      accessorKey: "trade_type",
      header: "Type",
      cell: ({ row }) => <TradeBadge type={row.original.trade_type} />,
    },
    {
      id: "security",
      header: "Security",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.security.ticker}</span>
      ),
    },
    {
      id: "qty",
      header: "Qty",
      cell: ({ row }) => (
        <span className="tabular-nums">
          {row.original.quantity.toLocaleString("en-NZ")}
        </span>
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
      accessorKey: "trade_date",
      header: "Date",
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
  ];

  return (
    <div className="altura-card overflow-hidden">
      <div className="px-5 py-4 border-b" style={{ borderColor: "var(--altura-border)" }}>
        <h2 className="text-sm font-semibold" style={{ color: "var(--altura-text-primary)" }}>
          Recent Trades
        </h2>
      </div>
      <DataTable columns={columns} data={trades.slice(0, 10)} isLoading={isLoading} compact />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const m = DASHBOARD_METRICS;

  const metrics = [
    {
      label: "Total AUM",
      value: fmtCurrency(m.total_aum_nzd, true),
      change: "+3.2% MTD",
      changeType: "positive" as const,
      description: "Across all active funds",
      icon: DollarSign,
    },
    {
      label: "Active Funds",
      value: String(m.num_funds),
      change: "0 changes",
      changeType: "neutral" as const,
      description: "NZG · PIF · GHF",
      icon: Briefcase,
    },
    {
      label: "Total Holdings",
      value: String(m.total_holdings),
      change: "+2 today",
      changeType: "positive" as const,
      description: "Across all funds",
      icon: BarChart3,
    },
    {
      label: "Daily P&L",
      value: fmtCurrency(m.daily_pnl, true),
      change: `${m.daily_pnl_pct >= 0 ? "+" : ""}${m.daily_pnl_pct.toFixed(2)}%`,
      changeType: (m.daily_pnl >= 0 ? "positive" : "negative") as "positive" | "negative",
      description: "Net across all funds",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--altura-text-primary)" }}>
          Overview
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--altura-text-secondary)" }}>
          Portfolio summary — 31 March 2026
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>

      {/* Charts + Activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AumChart />
        </div>
        <div className="altura-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "var(--altura-text-muted)" }}>
            Open Orders
          </p>
          <p className="text-3xl font-semibold tabular-nums" style={{ color: "var(--altura-text-primary)" }}>
            {m.open_orders}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--altura-text-muted)" }}>
            Pending execution
          </p>
          <div className="gold-accent-line mt-3" />
          <div className="mt-4 space-y-2">
            {[
              { label: "Pending", value: 4, color: "var(--status-warning)" },
              { label: "Submitted", value: 2, color: "var(--status-info)" },
              { label: "Partial", value: 1, color: "var(--altura-gold)" },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between text-xs">
                <span style={{ color: "var(--altura-text-muted)" }}>{s.label}</span>
                <span className="font-medium tabular-nums" style={{ color: s.color }}>
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fund Table */}
      <FundOverviewTable />

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  );
}
