"use client";

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ExpandedState,
  type VisibilityState,
  type Row,
} from "@tanstack/react-table";
import { useState } from "react";
import { ChevronDown, ChevronRight, ChevronUp, ChevronsUpDown, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  getRowCanExpand?: (row: Row<TData>) => boolean;
  renderSubComponent?: (props: { row: Row<TData> }) => React.ReactElement;
  className?: string;
  stickyHeader?: boolean;
}

export function DataTable<TData>({
  columns,
  data,
  getRowCanExpand,
  renderSubComponent,
  className,
  stickyHeader = false,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, expanded, columnVisibility },
    onSortingChange: setSorting,
    onExpandedChange: setExpanded,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand,
  });

  return (
    <div className={cn("relative", className)}>
      {/* Column visibility toggle */}
      <div className="flex justify-end mb-2">
        <div className="relative">
          <button
            onClick={() => setShowColumnMenu(!showColumnMenu)}
            className="flex items-center gap-1.5 text-xs rounded-md px-2.5 py-1.5 transition-colors"
            style={{
              color: "var(--altura-text-secondary)",
              border: "1px solid var(--altura-border)",
              backgroundColor: "var(--altura-navy-elevated)",
            }}
          >
            <Settings2 className="h-3.5 w-3.5" />
            Columns
          </button>
          {showColumnMenu && (
            <div
              className="absolute right-0 top-full mt-1 z-20 rounded-md p-2 min-w-[160px] space-y-1"
              style={{
                backgroundColor: "var(--altura-navy-elevated)",
                border: "1px solid var(--altura-border)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              }}
            >
              {table
                .getAllLeafColumns()
                .filter((col) => col.getCanHide())
                .map((column) => (
                  <label
                    key={column.id}
                    className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-white/5 text-xs"
                    style={{ color: "var(--altura-text-secondary)" }}
                  >
                    <input
                      type="checkbox"
                      checked={column.getIsVisible()}
                      onChange={column.getToggleVisibilityHandler()}
                      className="rounded"
                      style={{ accentColor: "var(--altura-gold)" }}
                    />
                    {typeof column.columnDef.header === "string"
                      ? column.columnDef.header
                      : column.id}
                  </label>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div
        className="overflow-auto rounded-lg"
        style={{ border: "1px solid var(--altura-border)" }}
        onClick={() => showColumnMenu && setShowColumnMenu(false)}
      >
        <table className="w-full text-sm border-collapse">
          <thead
            className={cn(stickyHeader && "sticky top-0 z-10")}
            style={{ backgroundColor: "var(--altura-navy-elevated)" }}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} style={{ borderBottom: "1px solid var(--altura-border)" }}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left font-medium select-none"
                    style={{
                      color: "var(--altura-text-muted)",
                      fontSize: "0.7rem",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}
                    colSpan={header.colSpan}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={cn(
                          "flex items-center gap-1",
                          header.column.getCanSort() && "cursor-pointer hover:opacity-80"
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span style={{ color: "var(--altura-text-muted)", opacity: 0.5 }}>
                            {header.column.getIsSorted() === "asc" ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : header.column.getIsSorted() === "desc" ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronsUpDown className="h-3 w-3" />
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
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-12 text-center text-sm"
                  style={{ color: "var(--altura-text-muted)" }}
                >
                  No data available
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, i) => (
                <>
                  <tr
                    key={row.id}
                    className="transition-colors hover:bg-white/[0.02]"
                    style={{
                      borderBottom:
                        i < table.getRowModel().rows.length - 1
                          ? "1px solid var(--altura-border)"
                          : "none",
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-3"
                        style={{ color: "var(--altura-text-primary)" }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                  {row.getIsExpanded() && renderSubComponent && (
                    <tr key={`${row.id}-expanded`}>
                      <td
                        colSpan={row.getVisibleCells().length}
                        style={{ backgroundColor: "var(--altura-navy-elevated)", padding: 0 }}
                      >
                        {renderSubComponent({ row })}
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Helper: expand toggle cell
export function ExpandCell({ row }: { row: Row<unknown> }) {
  if (!row.getCanExpand()) return null;
  return (
    <button
      onClick={row.getToggleExpandedHandler()}
      className="p-0.5 rounded hover:opacity-80 transition-opacity"
      style={{ color: "var(--altura-text-muted)" }}
    >
      {row.getIsExpanded() ? (
        <ChevronDown className="h-4 w-4" />
      ) : (
        <ChevronRight className="h-4 w-4" />
      )}
    </button>
  );
}
