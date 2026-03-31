"use client";

import { useFunds } from "@/hooks/useFunds";
import { formatCurrency, formatDate } from "@/lib/utils";
import { MOCK_HOLDINGS } from "@/lib/mock-data";
import Link from "next/link";
import { Briefcase, ArrowUpRight, TrendingUp } from "lucide-react";
import type { Fund } from "@/types/fund";

export const metadata = { title: "Funds" };

const STATUS_CONFIG = {
  active: { label: "Active", color: "var(--status-positive)", bg: "rgba(34,197,94,0.1)" },
  inactive: { label: "Inactive", color: "var(--status-neutral)", bg: "rgba(148,163,184,0.1)" },
  closed: { label: "Closed", color: "var(--status-negative)", bg: "rgba(239,68,68,0.1)" },
  soft_closed: { label: "Soft Closed", color: "var(--status-warning)", bg: "rgba(245,158,11,0.1)" },
};

function FundCard({ fund }: { fund: Fund }) {
  const status = STATUS_CONFIG[fund.status];
  const holdingCount = MOCK_HOLDINGS[fund.id]?.length ?? 0;

  return (
    <Link
      href={`/dashboard/funds/${fund.id}`}
      className="altura-card p-5 flex flex-col gap-4 hover:shadow-card-hover transition-all hover:border-gold group"
      style={{ textDecoration: "none" }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div
            className="font-semibold text-sm leading-tight group-hover:text-gold transition-colors"
            style={{ color: "var(--altura-text-primary)" }}
          >
            {fund.name}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="text-xs font-mono font-medium"
              style={{ color: "var(--altura-gold)" }}
            >
              {fund.ticker}
            </span>
            <span style={{ color: "var(--altura-text-muted)", fontSize: "0.6rem" }}>·</span>
            <span className="text-xs" style={{ color: "var(--altura-text-secondary)" }}>
              {fund.strategy}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="text-xs rounded-full px-2.5 py-1 font-medium"
            style={{ color: status.color, backgroundColor: status.bg }}
          >
            {status.label}
          </span>
          <ArrowUpRight
            className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: "var(--altura-gold)" }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <div className="text-xs" style={{ color: "var(--altura-text-muted)" }}>
            AUM (NZD)
          </div>
          <div
            className="text-sm font-semibold font-mono mt-0.5"
            style={{ color: "var(--altura-text-primary)" }}
          >
            {formatCurrency(fund.aum, { compact: true })}
          </div>
        </div>
        <div>
          <div className="text-xs" style={{ color: "var(--altura-text-muted)" }}>
            Holdings
          </div>
          <div
            className="text-sm font-semibold mt-0.5"
            style={{ color: "var(--altura-text-primary)" }}
          >
            {holdingCount}
          </div>
        </div>
        <div>
          <div className="text-xs" style={{ color: "var(--altura-text-muted)" }}>
            NAV
          </div>
          <div
            className="text-sm font-semibold font-mono mt-0.5"
            style={{ color: "var(--altura-text-primary)" }}
          >
            {fund.nav.toFixed(4)}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between pt-3"
        style={{ borderTop: "1px solid var(--altura-border)" }}
      >
        <span className="text-xs" style={{ color: "var(--altura-text-muted)" }}>
          Inception {formatDate(fund.inception_date, "short")}
        </span>
        <span className="text-xs" style={{ color: "var(--altura-text-muted)" }}>
          {fund.currency}
        </span>
      </div>
    </Link>
  );
}

export default function FundsPage() {
  const { data: funds = [], isLoading } = useFunds();

  const activeFunds = funds.filter((f) => f.status === "active");
  const otherFunds = funds.filter((f) => f.status !== "active");
  const totalAum = funds.reduce((s, f) => s + f.aum, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" style={{ color: "var(--altura-gold)" }} />
            <h1
              className="text-2xl font-semibold tracking-tight"
              style={{ color: "var(--altura-text-primary)" }}
            >
              Funds
            </h1>
          </div>
          <p className="text-sm mt-1" style={{ color: "var(--altura-text-secondary)" }}>
            {funds.length} funds · Total AUM{" "}
            <span style={{ color: "var(--altura-gold)" }}>
              {formatCurrency(totalAum, { compact: true })} NZD
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 text-xs rounded-full px-3 py-1.5"
            style={{
              backgroundColor: "rgba(34,197,94,0.1)",
              color: "var(--status-positive)",
            }}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            {activeFunds.length} active
          </div>
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total AUM", value: formatCurrency(totalAum, { compact: true }) },
          { label: "Active Funds", value: String(activeFunds.length) },
          { label: "Total Holdings", value: String(Object.values(MOCK_HOLDINGS).reduce((s, h) => s + h.length, 0)) },
          { label: "Currencies", value: "NZD / AUD / USD" },
        ].map(({ label, value }) => (
          <div key={label} className="altura-card px-4 py-3">
            <div className="text-xs" style={{ color: "var(--altura-text-muted)" }}>
              {label}
            </div>
            <div
              className="text-lg font-semibold mt-0.5"
              style={{ color: "var(--altura-text-primary)" }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="text-sm animate-pulse" style={{ color: "var(--altura-text-muted)" }}>
            Loading funds…
          </div>
        </div>
      ) : (
        <>
          {/* Active funds */}
          {activeFunds.length > 0 && (
            <div>
              <h2 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "var(--altura-text-muted)" }}>
                Active Funds
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {activeFunds.map((f) => (
                  <FundCard key={f.id} fund={f} />
                ))}
              </div>
            </div>
          )}

          {/* Other funds */}
          {otherFunds.length > 0 && (
            <div>
              <h2 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "var(--altura-text-muted)" }}>
                Other Funds
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {otherFunds.map((f) => (
                  <FundCard key={f.id} fund={f} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
