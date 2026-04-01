"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { FundSelector } from "@/components/dashboard/FundSelector";
import { DataTable, fmtCurrency, fmtNumber, PnlCell } from "@/components/data-table/DataTable";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useFundSummary } from "@/hooks/useFundSummary";
import { useFundStore } from "@/stores/fundStore";
import type { ColumnDef } from "@tanstack/react-table";
import type { Holding } from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

const holdingColumns: ColumnDef<Holding>[] = [
  {
    id: "name",
    header: "Security",
    accessorFn: (r) => r.security.name,
    cell: ({ row }) => (
      <div>
        <div className="font-medium" style={{ color: "var(--altura-text-primary)" }}>
          {row.original.security.name}
        </div>
        <div className="text-xs mt-0.5" style={{ color: "var(--altura-text-muted)" }}>
          {row.original.security.exchange}
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
    id: "currency",
    header: "CCY",
    accessorFn: (r) => r.security.currency,
    cell: ({ row }) => (
      <span className="text-xs" style={{ color: "var(--altura-text-muted)" }}>
        {row.original.security.currency}
      </span>
    ),
  },
  {
    id: "last_price",
    header: "Last Price",
    accessorFn: (r) => r.last_price,
    cell: ({ row }) => (
      <span className="tabular-nums">
        {row.original.security.currency === "NZD"
          ? `$${fmtNumber(row.original.last_price)}`
          : `${row.original.security.currency} ${fmtNumber(row.original.last_price)}`}
      </span>
    ),
  },
  {
    id: "quantity",
    header: "Quantity",
    accessorFn: (r) => r.quantity,
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.quantity.toLocaleString("en-NZ")}</span>
    ),
  },
  {
    id: "weight",
    header: "% Fund",
    accessorFn: (r) => r.weight_pct,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="tabular-nums text-xs w-12 text-right">
          {row.original.weight_pct.toFixed(2)}%
        </span>
        <div
          className="h-1.5 rounded-full overflow-hidden flex-1 max-w-[60px]"
          style={{ backgroundColor: "var(--altura-navy-elevated)" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(row.original.weight_pct * 3, 100)}%`,
              backgroundColor: "var(--altura-gold)",
              opacity: 0.7,
            }}
          />
        </div>
      </div>
    ),
  },
  {
    id: "value_local",
    header: "Value (Local)",
    accessorFn: (r) => r.market_value_local,
    cell: ({ row }) => (
      <span className="tabular-nums">
        {row.original.security.currency === "NZD"
          ? fmtCurrency(row.original.market_value_local)
          : `${row.original.security.currency} ${fmtNumber(row.original.market_value_local)}`}
      </span>
    ),
  },
  {
    id: "value_nzd",
    header: "Value (NZD)",
    accessorFn: (r) => r.market_value_nzd,
    cell: ({ row }) => (
      <span className="tabular-nums font-medium">{fmtCurrency(row.original.market_value_nzd)}</span>
    ),
  },
  {
    id: "pnl",
    header: "P&L %",
    accessorFn: (r) => r.pnl_pct,
    cell: ({ row }) => <PnlCell value={row.original.pnl_pct} />,
  },
];

const assetTypeColors: Record<string, string> = {
  Stocks: "#C5A572",
  "Fixed Income": "#3B82F6",
  Hedges: "#8B5CF6",
  Cash: "#22C55E",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PortfolioPage() {
  const { selectedFundId } = useFundStore();
  const effectiveFundId = selectedFundId ?? "f-nzg";

  const { data: groups = [], isLoading } = usePortfolio(effectiveFundId);
  const { data: summary } = useFundSummary(effectiveFundId);

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  function toggleGroup(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const totalValue = groups.reduce((s, g) => s + g.total_value_nzd, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--altura-text-primary)" }}>
            Portfolio
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--altura-text-secondary)" }}>
            Holdings breakdown by asset type — as of 31 March 2026
          </p>
        </div>
        <FundSelector />
      </div>

      {/* Summary bar */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Fund AUM", value: fmtCurrency(summary.total_aum_nzd, true) },
            { label: "Holdings", value: String(summary.num_holdings) },
            {
              label: "Daily P&L",
              value: fmtCurrency(summary.daily_pnl, true),
              color: summary.daily_pnl >= 0 ? "var(--status-positive)" : "var(--status-negative)",
            },
            {
              label: "MTD Return",
              value: `${summary.mtd_return >= 0 ? "+" : ""}${summary.mtd_return.toFixed(2)}%`,
              color: summary.mtd_return >= 0 ? "var(--status-positive)" : "var(--status-negative)",
            },
          ].map((item) => (
            <div key={item.label} className="altura-card px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--altura-text-muted)" }}>
                {item.label}
              </p>
              <p
                className="mt-1 text-lg font-semibold tabular-nums"
                style={{ color: item.color ?? "var(--altura-text-primary)" }}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Asset allocation bar */}
      {!isLoading && groups.length > 0 && (
        <div className="altura-card px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "var(--altura-text-muted)" }}>
            Asset Allocation
          </p>
          <div className="flex h-3 w-full rounded-full overflow-hidden gap-0.5">
            {groups.map((g) => (
              <div
                key={g.asset_type.id}
                style={{
                  width: `${g.weight_pct}%`,
                  backgroundColor: assetTypeColors[g.asset_type.name] ?? "#64748B",
                  opacity: 0.85,
                }}
                title={`${g.asset_type.name}: ${g.weight_pct.toFixed(1)}%`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3">
            {groups.map((g) => (
              <div key={g.asset_type.id} className="flex items-center gap-1.5 text-xs">
                <div
                  className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: assetTypeColors[g.asset_type.name] ?? "#64748B" }}
                />
                <span style={{ color: "var(--altura-text-secondary)" }}>{g.asset_type.name}</span>
                <span className="tabular-nums font-medium" style={{ color: "var(--altura-text-primary)" }}>
                  {g.weight_pct.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grouped Holdings */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="altura-card p-5">
              <div className="h-4 w-32 rounded animate-pulse mb-4" style={{ backgroundColor: "var(--altura-navy-elevated)" }} />
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-3 rounded animate-pulse" style={{ backgroundColor: "var(--altura-navy-elevated)", width: `${50 + j * 15}%` }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => {
            const isCollapsed = collapsed.has(group.asset_type.id);
            const accentColor = assetTypeColors[group.asset_type.name] ?? "#64748B";

            return (
              <div
                key={group.asset_type.id}
                className="overflow-hidden rounded-lg border"
                style={{ borderColor: "var(--altura-border)" }}
              >
                <button
                  onClick={() => toggleGroup(group.asset_type.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                  style={{ backgroundColor: "var(--altura-navy-elevated)" }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(197,165,114,0.04)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--altura-navy-elevated)")
                  }
                >
                  <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: accentColor }} />
                  <span className="font-semibold text-sm" style={{ color: "var(--altura-text-primary)" }}>
                    {group.asset_type.name}
                  </span>
                  <span
                    className="text-xs rounded-full px-1.5 py-0.5"
                    style={{ backgroundColor: `${accentColor}1A`, color: accentColor }}
                  >
                    {group.count} holding{group.count !== 1 ? "s" : ""}
                  </span>
                  <div className="flex-1" />
                  <span className="tabular-nums text-sm font-medium" style={{ color: "var(--altura-text-primary)" }}>
                    {fmtCurrency(group.total_value_nzd, true)}
                  </span>
                  <span className="tabular-nums text-xs ml-2" style={{ color: "var(--altura-text-muted)" }}>
                    {group.weight_pct.toFixed(1)}%
                  </span>
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 ml-2 flex-shrink-0" style={{ color: "var(--altura-text-muted)" }} />
                  ) : (
                    <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0" style={{ color: "var(--altura-text-muted)" }} />
                  )}
                </button>

                {!isCollapsed && <DataTable columns={holdingColumns} data={group.holdings} compact />}
              </div>
            );
          })}
        </div>
      )}

      {/* Summary totals */}
      {!isLoading && groups.length > 0 && (
        <div
          className="flex items-center justify-between px-5 py-3 rounded-lg border"
          style={{ backgroundColor: "var(--altura-navy-elevated)", borderColor: "var(--altura-border)" }}
        >
          <span className="text-sm font-semibold" style={{ color: "var(--altura-text-primary)" }}>
            Total Portfolio Value
          </span>
          <span className="text-lg font-semibold tabular-nums" style={{ color: "var(--altura-gold)" }}>
            {fmtCurrency(totalValue)}
          </span>
        </div>
      )}
    </div>
  );
}
