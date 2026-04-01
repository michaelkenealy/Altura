"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { DataTable, fmtCurrency, StatusBadge } from "@/components/data-table/DataTable";
import { useFunds } from "@/hooks/useFunds";
import { useAllFundSummaries } from "@/hooks/useFundSummary";
import type { ColumnDef } from "@tanstack/react-table";
import type { MockFund, FundSummary } from "@/lib/mock-data";

type Row = { fund: MockFund; summary?: FundSummary };

const columns: ColumnDef<Row>[] = [
  {
    id: "name",
    header: "Fund Name",
    accessorFn: (r) => r.fund.name,
    cell: ({ row }) => (
      <div>
        <div className="font-medium" style={{ color: "var(--altura-text-primary)" }}>
          {row.original.fund.name}
        </div>
        <div className="text-xs mt-0.5" style={{ color: "var(--altura-text-muted)" }}>
          {row.original.fund.description}
        </div>
      </div>
    ),
  },
  {
    id: "code",
    header: "Code",
    accessorFn: (r) => r.fund.code,
    cell: ({ row }) => (
      <span
        className="font-mono text-xs font-semibold rounded px-2 py-0.5"
        style={{ backgroundColor: "rgba(197,165,114,0.12)", color: "var(--altura-gold)" }}
      >
        {row.original.fund.code}
      </span>
    ),
  },
  {
    id: "currency",
    header: "CCY",
    accessorFn: (r) => r.fund.currency,
    cell: ({ row }) => (
      <span className="text-xs" style={{ color: "var(--altura-text-secondary)" }}>
        {row.original.fund.currency}
      </span>
    ),
  },
  {
    id: "aum",
    header: "AUM (NZD)",
    accessorFn: (r) => r.summary?.total_aum_nzd ?? r.fund.aum,
    cell: ({ row }) => (
      <span className="tabular-nums font-semibold">
        {fmtCurrency(row.original.summary?.total_aum_nzd ?? row.original.fund.aum, true)}
      </span>
    ),
  },
  {
    id: "nav",
    header: "NAV",
    accessorFn: (r) => r.fund.nav,
    cell: ({ row }) => (
      <span className="tabular-nums">${row.original.fund.nav.toFixed(4)}</span>
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
    id: "mtd",
    header: "MTD Return",
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
    id: "ytd",
    header: "YTD Return",
    accessorFn: (r) => r.summary?.ytd_return ?? 0,
    cell: ({ row }) => {
      const v = row.original.summary?.ytd_return ?? 0;
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
    id: "inception",
    header: "Inception",
    accessorFn: (r) => r.fund.inception_date,
    cell: ({ row }) => (
      <span style={{ color: "var(--altura-text-muted)" }}>
        {new Date(row.original.fund.inception_date).toLocaleDateString("en-NZ", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    accessorFn: (r) => r.fund.status,
    cell: ({ row }) => <StatusBadge status={row.original.fund.status} />,
  },
];

export default function FundsPage() {
  const router = useRouter();
  const { data: funds = [], isLoading: fundsLoading } = useFunds();
  const { data: summaries = [], isLoading: summaryLoading } = useAllFundSummaries();

  const isLoading = fundsLoading || summaryLoading;

  const rows: Row[] = funds.map((fund) => ({
    fund,
    summary: summaries.find((s) => s.fund_id === fund.id),
  }));

  const totalAum = summaries.reduce((s, f) => s + f.total_aum_nzd, 0);
  const activeFunds = funds.filter((f) => f.status === "active").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--altura-text-primary)" }}>
            Funds
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--altura-text-secondary)" }}>
            Manage and monitor your investment funds
          </p>
        </div>
        <button
          className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
          style={{
            backgroundColor: "var(--altura-gold)",
            borderColor: "var(--altura-gold)",
            color: "var(--altura-navy)",
          }}
        >
          <Plus className="h-4 w-4" />
          New Fund
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total AUM", value: fmtCurrency(totalAum, true) },
          { label: "Active Funds", value: String(activeFunds) },
          { label: "Total Holdings", value: String(summaries.reduce((s, f) => s + f.num_holdings, 0)) },
          {
            label: "Avg MTD Return",
            value:
              summaries.length > 0
                ? `+${(summaries.reduce((s, f) => s + f.mtd_return, 0) / summaries.length).toFixed(2)}%`
                : "—",
            color: "var(--status-positive)",
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
              {isLoading ? "—" : item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Funds table */}
      <div className="altura-card overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--altura-border)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--altura-text-primary)" }}>
            All Funds
          </h2>
        </div>
        <DataTable
          columns={columns}
          data={rows}
          isLoading={isLoading}
          onRowClick={(row) => router.push(`/dashboard/funds/${row.fund.id}`)}
        />
      </div>
    </div>
  );
}
