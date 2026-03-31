"use client";

import { useState } from "react";
import { usePortfolio } from "@/hooks/useHoldings";
import { useFundStore } from "@/stores/fundStore";
import { useFund } from "@/hooks/useFunds";
import { DataTable } from "@/components/data-table/DataTable";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { Holding, AssetType } from "@/lib/mock-data";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from "lucide-react";

export const metadata = { title: "Portfolio" };

const ASSET_TYPE_ORDER: AssetType[] = ["Stocks", "Fixed Income", "Hedges", "Cash"];

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
        {row.original.last_price.toLocaleString("en-NZ", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 4,
        })}
      </span>
    ),
  },
  {
    id: "weight",
    header: "% Fund",
    accessorKey: "weight",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div
          className="h-1.5 rounded-full"
          style={{
            width: `${Math.max(2, Math.min(80, row.original.weight))}px`,
            backgroundColor: ASSET_TYPE_COLORS[row.original.asset_type],
            opacity: 0.7,
          }}
        />
        <span className="font-mono text-sm" style={{ color: "var(--altura-text-primary)" }}>
          {row.original.weight.toFixed(2)}%
        </span>
      </div>
    ),
  },
  {
    id: "local_value",
    header: "$ Local FX",
    accessorKey: "local_value",
    cell: ({ row }) => (
      <span className="font-mono text-sm" style={{ color: "var(--altura-text-secondary)" }}>
        {row.original.local_currency !== "NZD" && (
          <span className="text-xs mr-1" style={{ color: "var(--altura-text-muted)" }}>
            {row.original.local_currency}
          </span>
        )}
        {formatCurrency(row.original.local_value, { compact: true }).replace("$", "")}
      </span>
    ),
  },
  {
    id: "nzd_value",
    header: "$ NZD Value",
    accessorKey: "nzd_value",
    cell: ({ row }) => (
      <span className="font-mono text-sm font-medium" style={{ color: "var(--altura-text-primary)" }}>
        {formatCurrency(row.original.nzd_value, { compact: true })}
      </span>
    ),
  },
  {
    id: "unrealized_pnl",
    header: "Unrealised P&L",
    accessorKey: "unrealized_pnl",
    cell: ({ row }) => {
      const pnl = row.original.unrealized_pnl;
      const pct = row.original.unrealized_pnl_pct;
      const positive = pnl >= 0;
      return (
        <div className="flex items-center gap-1">
          {positive ? (
            <TrendingUp className="h-3.5 w-3.5" style={{ color: "var(--status-positive)" }} />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" style={{ color: "var(--status-negative)" }} />
          )}
          <div>
            <div
              className="font-mono text-sm font-medium"
              style={{ color: positive ? "var(--status-positive)" : "var(--status-negative)" }}
            >
              {formatCurrency(Math.abs(pnl), { compact: true })}
            </div>
            <div
              className="text-xs font-mono"
              style={{ color: positive ? "var(--status-positive)" : "var(--status-negative)", opacity: 0.8 }}
            >
              {formatPercent(pct)}
            </div>
          </div>
        </div>
      );
    },
  },
];

function AssetTypeGroup({
  assetType,
  holdings,
  totalFundNzd,
}: {
  assetType: AssetType;
  holdings: Holding[];
  totalFundNzd: number;
}) {
  const [expanded, setExpanded] = useState(true);

  const groupNzd = holdings.reduce((s, h) => s + h.nzd_value, 0);
  const groupWeight = holdings.reduce((s, h) => s + h.weight, 0);
  const groupPnl = holdings.reduce((s, h) => s + h.unrealized_pnl, 0);
  const color = ASSET_TYPE_COLORS[assetType];

  return (
    <div className="altura-card overflow-hidden">
      {/* Group header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-5 py-4 transition-colors hover:bg-white/[0.02]"
        style={{ borderBottom: expanded ? "1px solid var(--altura-border)" : "none" }}
      >
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />

        <div className="flex-1 flex items-center gap-4 min-w-0">
          <span className="font-semibold text-sm" style={{ color: "var(--altura-text-primary)" }}>
            {assetType}
          </span>
          <span
            className="text-xs rounded-full px-2 py-0.5"
            style={{
              color,
              backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
            }}
          >
            {holdings.length} {holdings.length === 1 ? "position" : "positions"}
          </span>
        </div>

        <div className="flex items-center gap-8 text-right">
          <div className="hidden sm:block">
            <div className="text-xs" style={{ color: "var(--altura-text-muted)" }}>
              Weight
            </div>
            <div className="font-mono text-sm" style={{ color: "var(--altura-text-primary)" }}>
              {groupWeight.toFixed(2)}%
            </div>
          </div>
          <div className="hidden md:block">
            <div className="text-xs" style={{ color: "var(--altura-text-muted)" }}>
              NZD Value
            </div>
            <div
              className="font-mono text-sm font-medium"
              style={{ color: "var(--altura-text-primary)" }}
            >
              {formatCurrency(groupNzd, { compact: true })}
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="text-xs" style={{ color: "var(--altura-text-muted)" }}>
              Unreal. P&L
            </div>
            <div
              className="font-mono text-sm font-medium"
              style={{ color: groupPnl >= 0 ? "var(--status-positive)" : "var(--status-negative)" }}
            >
              {groupPnl >= 0 ? "+" : ""}
              {formatCurrency(groupPnl, { compact: true })}
            </div>
          </div>
          <div style={{ color: "var(--altura-text-muted)" }}>
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
        </div>
      </button>

      {/* Holdings table */}
      {expanded && (
        <div className="px-2 py-2">
          <DataTable columns={holdingColumns} data={holdings} />
        </div>
      )}
    </div>
  );
}

export default function PortfolioPage() {
  const { selectedFundId } = useFundStore();
  const { data: fund } = useFund(selectedFundId);
  const { data: portfolio, isLoading, error } = usePortfolio(selectedFundId);

  if (!selectedFundId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm" style={{ color: "var(--altura-text-muted)" }}>
          Select a fund from the top bar to view its portfolio.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm animate-pulse" style={{ color: "var(--altura-text-muted)" }}>
          Loading portfolio…
        </div>
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm" style={{ color: "var(--status-negative)" }}>
          Failed to load portfolio data.
        </p>
      </div>
    );
  }

  const orderedGroups = ASSET_TYPE_ORDER.filter((t) => portfolio.grouped[t]?.length > 0);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" style={{ color: "var(--altura-gold)" }} />
            <h1
              className="text-2xl font-semibold tracking-tight"
              style={{ color: "var(--altura-text-primary)" }}
            >
              Portfolio
            </h1>
          </div>
          {fund && (
            <p className="text-sm mt-1" style={{ color: "var(--altura-text-secondary)" }}>
              {fund.name}{" "}
              <span className="font-mono" style={{ color: "var(--altura-gold)" }}>
                {fund.ticker}
              </span>{" "}
              · {portfolio.holdings.length} positions
            </p>
          )}
        </div>
        <div className="text-right">
          <div className="text-xs" style={{ color: "var(--altura-text-muted)" }}>
            Total NZD Value
          </div>
          <div
            className="text-xl font-semibold font-mono"
            style={{ color: "var(--altura-text-primary)" }}
          >
            {formatCurrency(portfolio.totalNzdValue, { compact: false })}
          </div>
        </div>
      </div>

      {/* Allocation summary bar */}
      <div className="altura-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium" style={{ color: "var(--altura-text-muted)" }}>
            ALLOCATION
          </span>
        </div>
        <div className="flex rounded-full overflow-hidden h-2 gap-0.5">
          {portfolio.summary.map((s) => (
            <div
              key={s.asset_type}
              style={{
                width: `${s.weight}%`,
                backgroundColor: ASSET_TYPE_COLORS[s.asset_type as AssetType],
                opacity: 0.8,
              }}
              title={`${s.asset_type}: ${s.weight.toFixed(1)}%`}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-4 mt-3">
          {portfolio.summary.map((s) => (
            <div key={s.asset_type} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: ASSET_TYPE_COLORS[s.asset_type as AssetType] }}
              />
              <span className="text-xs" style={{ color: "var(--altura-text-secondary)" }}>
                {s.asset_type}
              </span>
              <span className="text-xs font-mono" style={{ color: "var(--altura-text-primary)" }}>
                {s.weight.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Asset type groups */}
      {orderedGroups.map((assetType) => (
        <AssetTypeGroup
          key={assetType}
          assetType={assetType}
          holdings={portfolio.grouped[assetType]}
          totalFundNzd={portfolio.totalNzdValue}
        />
      ))}

      {/* Fund total */}
      <div
        className="altura-card px-5 py-4 flex items-center justify-between"
        style={{ borderColor: "var(--altura-gold)", borderWidth: "1px" }}
      >
        <span className="text-sm font-semibold" style={{ color: "var(--altura-text-primary)" }}>
          Total Fund Value
        </span>
        <div className="text-right">
          <div
            className="text-xl font-semibold font-mono"
            style={{ color: "var(--altura-gold)" }}
          >
            {formatCurrency(portfolio.totalNzdValue)}
          </div>
          <div className="text-xs" style={{ color: "var(--altura-text-muted)" }}>
            {portfolio.holdings.length} positions ·{" "}
            {portfolio.summary.map((s) => `${s.asset_type} ${s.weight.toFixed(0)}%`).join(" · ")}
          </div>
        </div>
      </div>
    </div>
  );
}
