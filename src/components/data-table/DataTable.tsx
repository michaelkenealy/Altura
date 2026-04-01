"use client";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue = unknown> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowClick?: (row: TData) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  compact?: boolean;
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-t" style={{ borderColor: "var(--altura-border)" }}>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="h-3 rounded animate-pulse"
            style={{ backgroundColor: "var(--altura-navy-elevated)", width: `${60 + (i % 3) * 15}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

export function DataTable<TData, TValue = unknown>({
  columns,
  data,
  onRowClick,
  isLoading = false,
  emptyMessage = "No data available",
  compact = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const cellPy = compact ? "py-2" : "py-3";

  return (
    <div
      className="overflow-hidden rounded-lg border"
      style={{ borderColor: "var(--altura-border)" }}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                style={{ backgroundColor: "var(--altura-navy-elevated)" }}
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(
                      "px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap",
                      header.column.getCanSort() && "cursor-pointer select-none"
                    )}
                    style={{ color: "var(--altura-text-muted)" }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center gap-1.5">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="flex-shrink-0">
                            {header.column.getIsSorted() === "asc" ? (
                              <ChevronUp className="h-3 w-3" style={{ color: "var(--altura-gold)" }} />
                            ) : header.column.getIsSorted() === "desc" ? (
                              <ChevronDown className="h-3 w-3" style={{ color: "var(--altura-gold)" }} />
                            ) : (
                              <ChevronsUpDown className="h-3 w-3 opacity-30" />
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} cols={columns.length} />
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-sm"
                  style={{ color: "var(--altura-text-muted)" }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-t transition-colors",
                    onRowClick && "cursor-pointer"
                  )}
                  style={{
                    borderColor: "var(--altura-border)",
                    backgroundColor:
                      i % 2 === 0
                        ? "var(--altura-navy-surface)"
                        : "rgba(22,32,64,0.4)",
                  }}
                  onMouseEnter={(e) => {
                    if (onRowClick) {
                      (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                        "rgba(197,165,114,0.06)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                      i % 2 === 0
                        ? "var(--altura-navy-surface)"
                        : "rgba(22,32,64,0.4)";
                  }}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={cn("px-4 whitespace-nowrap", cellPy)}
                      style={{ color: "var(--altura-text-primary)" }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cell formatters — import these in column definitions
// ---------------------------------------------------------------------------

export function fmtCurrency(value: number, compact = false): string {
  if (compact) {
    if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (Math.abs(value) >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  }
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function fmtNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat("en-NZ", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function fmtPercent(value: number, decimals = 2): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}

export function PnlCell({ value }: { value: number }) {
  const color =
    value > 0
      ? "var(--status-positive)"
      : value < 0
      ? "var(--status-negative)"
      : "var(--altura-text-muted)";
  return (
    <span style={{ color }} className="font-medium tabular-nums">
      {fmtPercent(value)}
    </span>
  );
}

export function StatusBadge({
  status,
}: {
  status: "active" | "inactive" | "closed" | "soft_closed" | "suspended" | string;
}) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    active: { label: "Active", color: "var(--status-positive)", bg: "rgba(34,197,94,0.1)" },
    inactive: { label: "Inactive", color: "var(--status-neutral)", bg: "rgba(148,163,184,0.1)" },
    suspended: { label: "Suspended", color: "var(--status-warning)", bg: "rgba(245,158,11,0.1)" },
    closed: { label: "Closed", color: "var(--status-negative)", bg: "rgba(239,68,68,0.1)" },
    soft_closed: { label: "Soft Closed", color: "var(--status-warning)", bg: "rgba(245,158,11,0.1)" },
  };
  const c = config[status] ?? config.inactive;
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ color: c.color, backgroundColor: c.bg }}
    >
      {c.label}
    </span>
  );
}

export function TradeBadge({ type }: { type: "buy" | "sell" }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide"
      style={
        type === "buy"
          ? { color: "var(--status-positive)", backgroundColor: "rgba(34,197,94,0.1)" }
          : { color: "var(--status-negative)", backgroundColor: "rgba(239,68,68,0.1)" }
      }
    >
      {type}
    </span>
  );
}

export function OrderStatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; bg: string }> = {
    pending: { color: "var(--status-warning)", bg: "rgba(245,158,11,0.1)" },
    submitted: { color: "var(--status-info)", bg: "rgba(59,130,246,0.1)" },
    partial: { color: "var(--altura-gold)", bg: "rgba(197,165,114,0.1)" },
    filled: { color: "var(--status-positive)", bg: "rgba(34,197,94,0.1)" },
    cancelled: { color: "var(--status-neutral)", bg: "rgba(148,163,184,0.1)" },
    rejected: { color: "var(--status-negative)", bg: "rgba(239,68,68,0.1)" },
  };
  const c = config[status] ?? config.pending;
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize"
      style={{ color: c.color, backgroundColor: c.bg }}
    >
      {status}
    </span>
  );
}
