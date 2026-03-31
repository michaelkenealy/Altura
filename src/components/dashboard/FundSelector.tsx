"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search, Briefcase } from "lucide-react";
import { useFundStore } from "@/stores/fundStore";
import { useFunds } from "@/hooks/useFunds";
import { cn } from "@/lib/utils";

export function FundSelector() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const { selectedFundId, setSelectedFundId, setFunds } = useFundStore();
  const { data: funds = [], isLoading } = useFunds();

  // Seed the store when funds load
  useEffect(() => {
    if (funds.length > 0) {
      setFunds(funds);
      if (!selectedFundId) {
        setSelectedFundId(funds[0].id);
      }
    }
  }, [funds, selectedFundId, setFunds, setSelectedFundId]);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const selectedFund = funds.find((f) => f.id === selectedFundId);
  const filtered = funds.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.ticker.toLowerCase().includes(search.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    active: "var(--status-positive)",
    inactive: "var(--status-neutral)",
    closed: "var(--status-negative)",
    soft_closed: "var(--status-warning)",
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={isLoading}
        className="flex items-center gap-2 rounded-md px-3 py-1.5 transition-colors min-w-[200px] max-w-[260px]"
        style={{
          backgroundColor: "var(--altura-navy-elevated)",
          border: "1px solid var(--altura-border)",
          color: "var(--altura-text-primary)",
        }}
      >
        <Briefcase
          className="h-3.5 w-3.5 flex-shrink-0"
          style={{ color: "var(--altura-gold)" }}
        />
        <div className="flex-1 text-left min-w-0">
          {isLoading ? (
            <span className="text-xs" style={{ color: "var(--altura-text-muted)" }}>
              Loading funds…
            </span>
          ) : selectedFund ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium truncate">{selectedFund.name}</span>
              <span
                className="text-xs font-mono flex-shrink-0"
                style={{ color: "var(--altura-gold)" }}
              >
                {selectedFund.ticker}
              </span>
            </div>
          ) : (
            <span className="text-xs" style={{ color: "var(--altura-text-muted)" }}>
              Select fund…
            </span>
          )}
        </div>
        <ChevronDown
          className={cn("h-3.5 w-3.5 flex-shrink-0 transition-transform", open && "rotate-180")}
          style={{ color: "var(--altura-text-muted)" }}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1 z-50 rounded-md overflow-hidden min-w-[280px]"
          style={{
            backgroundColor: "var(--altura-navy-elevated)",
            border: "1px solid var(--altura-border)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}
        >
          {/* Search */}
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={{ borderBottom: "1px solid var(--altura-border)" }}
          >
            <Search className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "var(--altura-text-muted)" }} />
            <input
              autoFocus
              placeholder="Search funds…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: "var(--altura-text-primary)" }}
            />
          </div>

          {/* Options */}
          <div className="py-1 max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <div
                className="px-3 py-4 text-center text-xs"
                style={{ color: "var(--altura-text-muted)" }}
              >
                No funds found
              </div>
            ) : (
              filtered.map((fund) => (
                <button
                  key={fund.id}
                  onClick={() => {
                    setSelectedFundId(fund.id);
                    setOpen(false);
                    setSearch("");
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-medium"
                        style={{ color: "var(--altura-text-primary)" }}
                      >
                        {fund.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="text-xs font-mono"
                        style={{ color: "var(--altura-gold)" }}
                      >
                        {fund.ticker}
                      </span>
                      <span className="text-xs" style={{ color: "var(--altura-text-muted)" }}>
                        ·
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: statusColors[fund.status] ?? "var(--altura-text-muted)" }}
                      >
                        {fund.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  {fund.id === selectedFundId && (
                    <Check
                      className="h-3.5 w-3.5 flex-shrink-0"
                      style={{ color: "var(--altura-gold)" }}
                    />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
