"use client";

import { useFund } from "@/hooks/useFunds";
import { usePortfolio } from "@/hooks/useHoldings";
import { DataTable } from "@/components/data-table/DataTable";
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils";
import type { Holding, AssetType } from "@/lib/mock-data";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { ArrowLeft, Briefcase, TrendingUp, TrendingDown } from "lucide-react";

const ASSET_TYPE_COLORS: Record<AssetType, string> = {
  Stocks: "var(--status-info)",
  "Fixed Income": "var(--altura-gold)",
  Hedges: "var(--status-warning)",
  Cash: "var(--status-neutral)",
};

const holdingColumns: ColumnDef<Holding>[] = [
  {
    id: "name",
    header: "Name",
    accessorKey: "name",
    cell: ({ row }) => (
      <div>
        <div className="font-medium text-sm" style={{ color: "var(--altura-text-primary)" }}>
          {row.original.name}
        </div>
        <div className="text-xs font-mono mt-0.5" style={{ color: "var(--altura-gold)" }}>
          {row.original.ticker}
        </div>
      </div>
    ),
  },
  {
    id: "asset_type",
    header: "Type",
    accessorKey: "asset_type",
    cell: ({ row }) => {
      const color = ASSET_TYPE_COLORS[row.original.asset_type];
      return (
        <span
          className="text-xs rounded-full px-2 py-0.5 font-medium"
          style={{
            color,
            backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
          }}
        >
          {row.original.asset_type}
        </span>
      );
    },
  },
  {
    id: "last_price",
    header: "Last Price",
    accessorKey: "last_price",
    cell: ({ row }) => (
      <span className="font-mono text-sm" style={{ color: "var(--altura-text-primary)" }}>
        {row.original.local_currency !== "NZD" && (
          <span className="text-xs mr-1" style={{ color: "var(--altura-text-muted)" }}>
            {row.original.local_currency}
          </span>
        )}
        {row.original.last_price.toLocaleString("en-NZ", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
      </span>
    ),
  },
  {
    id: "weight",
    header: "% Fund",
    accessorKey: "weight",
    cell: ({ row }) => (
      <span className="font-mono text-sm" style={{ color: "var(--altura-text-primary)" }}>
        {row.original.weight.toFixed(2)}%
      </span>
    ),
  },
  {
    id: "nzd_value",
    header: "NZD Value",
    accessorKey: "nzd_value",
    cell: ({ row }) => (
      <span className="font-mono text-sm font-medium" style={{ color: "var(--altura-text-primary)" }}>
        {formatCurrency(row.original.nzd_value, { compact: true })}
      </span>
    ),
  },
  {
    id: "unrealized_pnl_pct",
    header: "Unreal. P&L",
    accessorKey: "unrealized_pnl_pct",
    cell: ({ row }) => {
      const pct = row.original.unrealized_pnl_pct;
      const positive = pct >= 0;
      return (
        <div
          className="flex items-center gap-1 font-mono text-sm font-medium"
          style={{ color: positive ? "var(--status-positive)" : "var(--status-negative)" }}
        >
          {positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {formatPercent(pct)}
        </div>
      );
    },
  },
];

export default function FundDetailPage({ params }: { params: { id: string } }) {
  const { data: fund, isLoading: fundLoading } = useFund(params.id);
  const { data: portfolio, isLoading: portLoading } = usePortfolio(params.id);

  if (fundLoading || portLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm animate-pulse" style={{ color: "var(--altura-text-muted)" }}>
          Loading fund details…
        </div>
      </div>
    );
  }

  if (!fund) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-sm" style={{ color: "var(--status-negative)" }}>
          Fund not found.
        </p>
        <Link href="/dashboard/funds" style={{ color: "var(--altura-gold)" }} className="text-sm">
          ← Back to Funds
        </Link>
      </div>
    );
  }

  const STATUS_CONFIG = {
    active: { label: "Active", color: "var(--status-positive)", bg: "rgba(34,197,94,0.1)" },
    inactive: { label: "Inactive", color: "var(--status-neutral)", bg: "rgba(148,163,184,0.1)" },
    closed: { label: "Closed", color: "var(--status-negative)", bg: "rgba(239,68,68,0.1)" },
    soft_closed: { label: "Soft Closed", color: "var(--status-warning)", bg: "rgba(245,158,11,0.1)" },
  };
  const status = STATUS_CONFIG[fund.status];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Back link */}
      <Link
        href="/dashboard/funds"
        className="inline-flex items-center gap-1.5 text-sm transition-opacity hover:opacity-80"
        style={{ color: "var(--altura-text-secondary)" }}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Funds
      </Link>

      {/* Fund header */}
      <div className="altura-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #C5A572 0%, #B08A52 100%)" }}
            >
              <Briefcase className="h-5 w-5" style={{ color: "var(--altura-navy)" }} />
            </div>
            <div>
              <h1
                className="text-xl font-semibold"
                style={{ color: "var(--altura-text-primary)" }}
              >
                {fund.name}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span
                  className="text-sm font-mono font-medium"
                  style={{ color: "var(--altura-gold)" }}
                >
                  {fund.ticker}
                </span>
                <span style={{ color: "var(--altura-text-muted)", fontSize: "0.7rem" }}>·</span>
                <span className="text-sm" style={{ color: "var(--altura-text-secondary)" }}>
                  {fund.strategy}
                </span>
              </div>
            </div>
          </div>
          <span
            className="text-xs rounded-full px-3 py-1.5 font-medium flex-shrink-0"
            style={{ color: status.color, backgroundColor: status.bg }}
          >
            {status.label}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-6 mt-6 sm:grid-cols-4">
          {[
            { label: "AUM (NZD)", value: formatCurrency(fund.aum, { compact: false }) },
            { label: "NAV", value: fund.nav.toFixed(4), mono: true },
            { label: "NAV Date", value: formatDate(fund.nav_date, "medium") },
            { label: "Inception Date", value: formatDate(fund.inception_date, "medium") },
          ].map(({ label, value, mono }) => (
            <div key={label}>
              <div className="text-xs" style={{ color: "var(--altura-text-muted)" }}>
                {label}
              </div>
              <div
                className={`text-sm font-semibold mt-0.5 ${mono ? "font-mono" : ""}`}
                style={{ color: "var(--altura-text-primary)" }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Allocation summary */}
      {portfolio && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {portfolio.summary.map((s) => {
              const color = ASSET_TYPE_COLORS[s.asset_type as AssetType];
              return (
                <div key={s.asset_type} className="altura-card px-4 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-xs" style={{ color: "var(--altura-text-muted)" }}>
                      {s.asset_type}
                    </span>
                  </div>
                  <div
                    className="text-lg font-semibold font-mono"
                    style={{ color: "var(--altura-text-primary)" }}
                  >
                    {s.weight.toFixed(1)}%
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--altura-text-secondary)" }}>
                    {formatCurrency(s.nzd_value, { compact: true })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Holdings table */}
          <div className="altura-card p-5">
            <h2
              className="text-sm font-semibold mb-4"
              style={{ color: "var(--altura-text-primary)" }}
            >
              All Holdings ({portfolio.holdings.length})
            </h2>
            <DataTable columns={holdingColumns} data={portfolio.holdings} />
          </div>
        </>
      )}
    </div>
  );
}
