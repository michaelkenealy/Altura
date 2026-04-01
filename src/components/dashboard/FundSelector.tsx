"use client";

import { ChevronDown, Briefcase } from "lucide-react";
import { useFundStore } from "@/stores/fundStore";
import { useFunds } from "@/hooks/useFunds";
import { useState, useRef, useEffect } from "react";

export function FundSelector() {
  const { data: funds = [], isLoading } = useFunds();
  const { selectedFundId, setSelectedFundId } = useFundStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = funds.find((f) => f.id === selectedFundId) ?? funds[0] ?? null;

  // Auto-select first fund on load
  useEffect(() => {
    if (!selectedFundId && funds.length > 0) {
      setSelectedFundId(funds[0].id);
    }
  }, [funds, selectedFundId, setSelectedFundId]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors"
        style={{
          backgroundColor: "var(--altura-navy-elevated)",
          borderColor: open ? "var(--altura-gold)" : "var(--altura-border)",
          color: "var(--altura-text-primary)",
          minWidth: 200,
        }}
        disabled={isLoading}
      >
        <div
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded"
          style={{ backgroundColor: "rgba(197,165,114,0.15)" }}
        >
          <Briefcase className="h-3.5 w-3.5" style={{ color: "var(--altura-gold)" }} />
        </div>
        <span className="flex-1 text-left truncate font-medium">
          {isLoading ? "Loading..." : selected ? `${selected.code} — ${selected.name}` : "Select Fund"}
        </span>
        <ChevronDown
          className="h-3.5 w-3.5 flex-shrink-0 transition-transform"
          style={{
            color: "var(--altura-text-muted)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1.5 w-full min-w-[240px] rounded-lg border py-1 shadow-lg"
          style={{
            backgroundColor: "var(--altura-navy-elevated)",
            borderColor: "var(--altura-border)",
          }}
        >
          {funds.map((fund) => {
            const isActive = fund.id === (selectedFundId ?? funds[0]?.id);
            return (
              <button
                key={fund.id}
                onClick={() => {
                  setSelectedFundId(fund.id);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors text-left"
                style={{
                  backgroundColor: isActive ? "rgba(197,165,114,0.08)" : "transparent",
                  color: isActive ? "var(--altura-gold)" : "var(--altura-text-secondary)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      "rgba(197,165,114,0.04)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{fund.name}</div>
                  <div className="text-xs mt-0.5 truncate" style={{ color: "var(--altura-text-muted)" }}>
                    {fund.code} · {fund.strategy}
                  </div>
                </div>
                {isActive && (
                  <div
                    className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: "var(--altura-gold)" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
