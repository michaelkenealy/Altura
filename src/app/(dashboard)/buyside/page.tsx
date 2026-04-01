"use client";

import { useState } from "react";
import { ChevronDown, Plus, X, TrendingUp, TrendingDown } from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";
import {
  MOCK_FUNDS,
  MOCK_CASH_PROJECTIONS,
  MOCK_MODEL_PORTFOLIO,
  MOCK_ORDERS,
  MOCK_SETTLEMENTS,
  formatNZD,
  formatDate,
  type Order,
  type OrderSide,
} from "@/lib/mock-data";

// ─── Status helpers ───────────────────────────────────────────────────────────

const ORDER_STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  draft:     { bg: "rgba(148,163,184,0.1)", color: "var(--altura-text-muted)" },
  pending:   { bg: "rgba(59,130,246,0.1)",  color: "var(--status-info)" },
  sent:      { bg: "rgba(245,158,11,0.1)",  color: "var(--status-warning)" },
  partial:   { bg: "rgba(245,158,11,0.15)", color: "#FBBF24" },
  filled:    { bg: "rgba(34,197,94,0.1)",   color: "var(--status-positive)" },
  cancelled: { bg: "rgba(239,68,68,0.1)",   color: "var(--status-negative)" },
};

function StatusBadge({ status }: { status: string }) {
  const s = ORDER_STATUS_STYLES[status] ?? ORDER_STATUS_STYLES.draft;
  return (
    <span
      className="rounded-full px-2 py-0.5 text-xs font-medium capitalize"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {status}
    </span>
  );
}

// ─── Order Form ───────────────────────────────────────────────────────────────

interface OrderFormState {
  fundId: string;
  security: string;
  side: OrderSide;
  quantity: string;
  limitPrice: string;
  broker: string;
  notes: string;
}

const BLANK_FORM = (fundId: string): OrderFormState => ({
  fundId,
  security: "",
  side: "buy",
  quantity: "",
  limitPrice: "",
  broker: "",
  notes: "",
});

const NZX_SECURITIES = [
  "FPH.NZ", "ANZ.NZ", "MEL.NZ", "AIA.NZ", "SPK.NZ",
  "MFT.NZ", "MCY.NZ", "IFT.NZ", "WBC.NZ", "CEN.NZ",
];

const BROKERS = ["Forsyth Barr", "Craigs Investment Partners", "Jarden", "Macquarie NZ"];

function OrderModal({
  fundId,
  onClose,
  onSubmit,
}: {
  fundId: string;
  onClose: () => void;
  onSubmit: (f: OrderFormState) => void;
}) {
  const [form, setForm] = useState<OrderFormState>(BLANK_FORM(fundId));
  const set = (k: keyof OrderFormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(10,22,40,0.85)" }}
    >
      <div
        className="w-full max-w-lg rounded-xl border p-6"
        style={{ backgroundColor: "var(--altura-navy-elevated)", borderColor: "var(--altura-border)" }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold" style={{ color: "var(--altura-text-primary)" }}>New Order</h2>
          <button onClick={onClose} style={{ color: "var(--altura-text-muted)" }}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Fund */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--altura-text-secondary)" }}>Fund</label>
            <select
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{ backgroundColor: "var(--altura-navy-surface)", borderColor: "var(--altura-border)", color: "var(--altura-text-primary)" }}
              value={form.fundId}
              onChange={(e) => set("fundId", e.target.value)}
            >
              {MOCK_FUNDS.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>

          {/* Security */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--altura-text-secondary)" }}>Security</label>
            <select
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{ backgroundColor: "var(--altura-navy-surface)", borderColor: "var(--altura-border)", color: "var(--altura-text-primary)" }}
              value={form.security}
              onChange={(e) => set("security", e.target.value)}
            >
              <option value="">Select security…</option>
              {NZX_SECURITIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Side + Quantity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--altura-text-secondary)" }}>Side</label>
              <div className="flex rounded-md overflow-hidden border" style={{ borderColor: "var(--altura-border)" }}>
                {(["buy", "sell"] as OrderSide[]).map((side) => (
                  <button
                    key={side}
                    onClick={() => set("side", side)}
                    className="flex-1 py-2 text-sm font-medium capitalize transition-colors"
                    style={{
                      backgroundColor: form.side === side
                        ? side === "buy" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"
                        : "var(--altura-navy-surface)",
                      color: form.side === side
                        ? side === "buy" ? "var(--status-positive)" : "var(--status-negative)"
                        : "var(--altura-text-muted)",
                    }}
                  >
                    {side}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--altura-text-secondary)" }}>Quantity</label>
              <input
                type="number"
                placeholder="0"
                className="w-full rounded-md border px-3 py-2 text-sm"
                style={{ backgroundColor: "var(--altura-navy-surface)", borderColor: "var(--altura-border)", color: "var(--altura-text-primary)" }}
                value={form.quantity}
                onChange={(e) => set("quantity", e.target.value)}
              />
            </div>
          </div>

          {/* Limit Price + Broker */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--altura-text-secondary)" }}>Limit Price (optional)</label>
              <input
                type="number"
                placeholder="Market"
                className="w-full rounded-md border px-3 py-2 text-sm"
                style={{ backgroundColor: "var(--altura-navy-surface)", borderColor: "var(--altura-border)", color: "var(--altura-text-primary)" }}
                value={form.limitPrice}
                onChange={(e) => set("limitPrice", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--altura-text-secondary)" }}>Broker</label>
              <select
                className="w-full rounded-md border px-3 py-2 text-sm"
                style={{ backgroundColor: "var(--altura-navy-surface)", borderColor: "var(--altura-border)", color: "var(--altura-text-primary)" }}
                value={form.broker}
                onChange={(e) => set("broker", e.target.value)}
              >
                <option value="">Select broker…</option>
                {BROKERS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--altura-text-secondary)" }}>Notes</label>
            <textarea
              rows={2}
              className="w-full rounded-md border px-3 py-2 text-sm resize-none"
              style={{ backgroundColor: "var(--altura-navy-surface)", borderColor: "var(--altura-border)", color: "var(--altura-text-primary)" }}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 rounded-md border py-2 text-sm"
            style={{ borderColor: "var(--altura-border)", color: "var(--altura-text-secondary)", backgroundColor: "transparent" }}
          >
            Cancel
          </button>
          <button
            onClick={() => { onSubmit(form); onClose(); }}
            className="flex-1 rounded-md py-2 text-sm font-medium"
            style={{ backgroundColor: "var(--altura-gold)", color: "var(--altura-navy)" }}
          >
            Submit Order
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Funds Summary ───────────────────────────────────────────────────────

function FundsSummaryTab({ fundId }: { fundId: string }) {
  const fund = MOCK_FUNDS.find((f) => f.id === fundId)!;
  const projections = MOCK_CASH_PROJECTIONS[fundId] ?? [];
  const pendingSettlements = MOCK_SETTLEMENTS.filter(
    (s) => s.fundId === fundId && (s.status === "pending" || s.status === "overdue")
  );

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "AUM", value: formatNZD(fund.aum, true), sub: "Assets Under Management" },
          { label: "NAV per Unit", value: `$${fund.nav.toFixed(4)}`, sub: `As at ${formatDate(fund.navDate)}` },
          { label: "Cash Balance", value: formatNZD(fund.cashBalance, true), sub: `${((fund.cashBalance / fund.aum) * 100).toFixed(1)}% of AUM` },
        ].map((m) => (
          <div key={m.label} className="altura-card p-4">
            <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--altura-text-muted)" }}>{m.label}</div>
            <div className="text-xl font-semibold" style={{ color: "var(--altura-text-primary)" }}>{m.value}</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--altura-text-muted)" }}>{m.sub}</div>
            <div className="gold-accent-line mt-3" />
          </div>
        ))}
      </div>

      {/* Cash Projection Table */}
      <div className="altura-card">
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--altura-border)" }}>
          <h3 className="text-sm font-semibold" style={{ color: "var(--altura-text-primary)" }}>5-Day Cash Projection</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--altura-text-muted)" }}>Forward cash flow forecast including T+2 settlements</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid var(--altura-border)` }}>
                {["Date", "Opening Cash", "Inflows", "Outflows", "Settlements", "Projected Balance"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--altura-text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projections.map((row, i) => (
                <tr key={row.date} style={{ borderBottom: i < projections.length - 1 ? `1px solid var(--altura-border)` : undefined }}>
                  <td className="px-5 py-3" style={{ color: "var(--altura-text-primary)" }}>{formatDate(row.date)}</td>
                  <td className="px-5 py-3" style={{ color: "var(--altura-text-secondary)" }}>{formatNZD(row.openingCash)}</td>
                  <td className="px-5 py-3" style={{ color: "var(--status-positive)" }}>+{formatNZD(row.inflows)}</td>
                  <td className="px-5 py-3" style={{ color: "var(--status-negative)" }}>-{formatNZD(Math.abs(row.outflows))}</td>
                  <td className="px-5 py-3" style={{ color: row.settlements < 0 ? "var(--status-negative)" : "var(--status-positive)" }}>
                    {row.settlements < 0 ? "-" : "+"}{formatNZD(Math.abs(row.settlements))}
                  </td>
                  <td className="px-5 py-3 font-medium" style={{ color: "var(--altura-gold)" }}>{formatNZD(row.projectedBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Settlements */}
      <div className="altura-card">
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--altura-border)" }}>
          <h3 className="text-sm font-semibold" style={{ color: "var(--altura-text-primary)" }}>
            Pending Settlements
            {pendingSettlements.length > 0 && (
              <span className="ml-2 rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: "rgba(245,158,11,0.15)", color: "var(--status-warning)" }}>
                {pendingSettlements.length}
              </span>
            )}
          </h3>
        </div>
        {pendingSettlements.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm" style={{ color: "var(--altura-text-muted)" }}>No pending settlements</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid var(--altura-border)` }}>
                  {["Trade ID", "Security", "Settlement Date", "Amount", "Counterparty", "Status"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--altura-text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendingSettlements.map((s, i) => (
                  <tr
                    key={s.id}
                    style={{
                      borderBottom: i < pendingSettlements.length - 1 ? `1px solid var(--altura-border)` : undefined,
                      backgroundColor: s.status === "overdue" ? "rgba(239,68,68,0.04)" : undefined,
                    }}
                  >
                    <td className="px-5 py-3 font-mono text-xs" style={{ color: "var(--altura-text-muted)" }}>{s.tradeId}</td>
                    <td className="px-5 py-3 font-medium" style={{ color: "var(--altura-text-primary)" }}>{s.security}</td>
                    <td className="px-5 py-3" style={{ color: s.status === "overdue" ? "var(--status-negative)" : "var(--altura-text-secondary)" }}>
                      {formatDate(s.settlementDate)}
                    </td>
                    <td className="px-5 py-3" style={{ color: "var(--altura-text-secondary)" }}>{formatNZD(s.amount)}</td>
                    <td className="px-5 py-3" style={{ color: "var(--altura-text-secondary)" }}>{s.counterparty}</td>
                    <td className="px-5 py-3">
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium capitalize"
                        style={{
                          backgroundColor: s.status === "overdue" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.1)",
                          color: s.status === "overdue" ? "var(--status-negative)" : "var(--status-warning)",
                        }}
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Model Portfolio ─────────────────────────────────────────────────────

function ModelPortfolioTab({ fundId }: { fundId: string }) {
  const holdings = MOCK_MODEL_PORTFOLIO[fundId] ?? [];

  return (
    <div className="altura-card">
      <div className="px-5 py-4 border-b" style={{ borderColor: "var(--altura-border)" }}>
        <h3 className="text-sm font-semibold" style={{ color: "var(--altura-text-primary)" }}>Model Portfolio — Target vs Actual</h3>
        <p className="text-xs mt-0.5" style={{ color: "var(--altura-text-muted)" }}>
          Drift threshold: ±1.0% triggers rebalance recommendation
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: `1px solid var(--altura-border)` }}>
              {["Security / Asset", "Asset Class", "Target %", "Actual %", "Drift %", "Drift Bar", "Action"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--altura-text-muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {holdings.map((h, i) => {
              const needsAction = Math.abs(h.driftPct) >= 1.0;
              const isOverweight = h.driftPct > 0;
              const driftColor = !needsAction
                ? "var(--altura-text-muted)"
                : isOverweight ? "var(--status-warning)" : "var(--status-info)";

              return (
                <tr
                  key={h.id}
                  style={{
                    borderBottom: i < holdings.length - 1 ? `1px solid var(--altura-border)` : undefined,
                    backgroundColor: needsAction ? "rgba(197,165,114,0.03)" : undefined,
                  }}
                >
                  <td className="px-5 py-3 font-medium" style={{ color: "var(--altura-text-primary)", maxWidth: 240 }}>
                    <span className="block truncate">{h.security}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: "rgba(59,130,246,0.1)", color: "var(--status-info)" }}>
                      {h.assetClass}
                    </span>
                  </td>
                  <td className="px-5 py-3" style={{ color: "var(--altura-text-secondary)" }}>{h.targetPct.toFixed(1)}%</td>
                  <td className="px-5 py-3 font-medium" style={{ color: "var(--altura-text-primary)" }}>{h.actualPct.toFixed(1)}%</td>
                  <td className="px-5 py-3 font-medium" style={{ color: driftColor }}>
                    {h.driftPct > 0 ? "+" : ""}{h.driftPct.toFixed(1)}%
                  </td>
                  <td className="px-5 py-3" style={{ minWidth: 100 }}>
                    <div className="relative h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--altura-border)", width: 80 }}>
                      <div
                        className="absolute top-0 h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(Math.abs(h.driftPct) / 3 * 100, 100)}%`,
                          left: h.driftPct < 0 ? undefined : "50%",
                          right: h.driftPct >= 0 ? undefined : "50%",
                          backgroundColor: !needsAction
                            ? "var(--altura-gold-muted)"
                            : isOverweight ? "var(--status-warning)" : "var(--status-info)",
                        }}
                      />
                      <div className="absolute top-0 bottom-0 w-px" style={{ left: "50%", backgroundColor: "var(--altura-border)" }} />
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {needsAction ? (
                      <span className="flex items-center gap-1 text-xs font-medium" style={{ color: isOverweight ? "var(--status-warning)" : "var(--status-info)" }}>
                        {isOverweight ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                        {isOverweight ? "Trim" : "Add"}
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: "var(--altura-text-muted)" }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab: Orders ──────────────────────────────────────────────────────────────

function OrdersTab({ fundId }: { fundId: string }) {
  const [showModal, setShowModal] = useState(false);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS.filter((o) => o.fundId === fundId));

  const handleSubmit = (form: OrderFormState) => {
    const newOrder: Order = {
      id: `ORD-${String(Date.now()).slice(-4)}`,
      date: new Date().toISOString().slice(0, 10),
      fundId: form.fundId,
      security: form.security,
      side: form.side,
      quantity: parseInt(form.quantity) || 0,
      limitPrice: form.limitPrice ? parseFloat(form.limitPrice) : null,
      status: "draft",
      broker: form.broker,
      filledQty: 0,
      notes: form.notes || undefined,
    };
    setOrders((prev) => [newOrder, ...prev]);
  };

  return (
    <>
      {showModal && (
        <OrderModal
          fundId={fundId}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
        />
      )}
      <div className="altura-card">
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--altura-border)" }}>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--altura-text-primary)" }}>Order Blotter</h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--altura-text-muted)" }}>{orders.length} orders</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium"
            style={{ backgroundColor: "var(--altura-gold)", color: "var(--altura-navy)" }}
          >
            <Plus className="h-4 w-4" />
            New Order
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid var(--altura-border)` }}>
                {["Date", "Security", "Side", "Quantity", "Limit Price", "Filled", "Broker", "Status"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--altura-text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-sm" style={{ color: "var(--altura-text-muted)" }}>
                    No orders for this fund
                  </td>
                </tr>
              ) : (
                orders.map((o, i) => (
                  <tr key={o.id} style={{ borderBottom: i < orders.length - 1 ? `1px solid var(--altura-border)` : undefined }}>
                    <td className="px-5 py-3 text-xs" style={{ color: "var(--altura-text-muted)" }}>{formatDate(o.date)}</td>
                    <td className="px-5 py-3 font-mono font-medium" style={{ color: "var(--altura-text-primary)" }}>{o.security}</td>
                    <td className="px-5 py-3">
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-semibold uppercase"
                        style={{
                          backgroundColor: o.side === "buy" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                          color: o.side === "buy" ? "var(--status-positive)" : "var(--status-negative)",
                        }}
                      >
                        {o.side}
                      </span>
                    </td>
                    <td className="px-5 py-3" style={{ color: "var(--altura-text-secondary)" }}>{o.quantity.toLocaleString()}</td>
                    <td className="px-5 py-3" style={{ color: "var(--altura-text-secondary)" }}>
                      {o.limitPrice ? `$${o.limitPrice.toFixed(2)}` : <span style={{ color: "var(--altura-text-muted)" }}>Market</span>}
                    </td>
                    <td className="px-5 py-3" style={{ color: "var(--altura-text-secondary)" }}>
                      {o.filledQty > 0 ? (
                        <span>
                          {o.filledQty.toLocaleString()}
                          <span className="ml-1 text-xs" style={{ color: "var(--altura-text-muted)" }}>
                            ({Math.round((o.filledQty / o.quantity) * 100)}%)
                          </span>
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: "var(--altura-text-secondary)" }}>{o.broker || "—"}</td>
                    <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "summary", label: "Funds Summary" },
  { id: "model", label: "Model Portfolio" },
  { id: "orders", label: "Orders" },
];

export default function BuysidePage() {
  const [selectedFundId, setSelectedFundId] = useState(MOCK_FUNDS[0].id);
  const [activeTab, setActiveTab] = useState("summary");
  const [showFundDropdown, setShowFundDropdown] = useState(false);

  const selectedFund = MOCK_FUNDS.find((f) => f.id === selectedFundId)!;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--altura-text-primary)" }}>Buyside</h1>
          <p className="text-sm mt-1" style={{ color: "var(--altura-text-secondary)" }}>Portfolio management and order execution</p>
        </div>

        {/* Fund Selector */}
        <div className="relative">
          <button
            onClick={() => setShowFundDropdown((v) => !v)}
            className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium"
            style={{
              backgroundColor: "var(--altura-navy-surface)",
              borderColor: "var(--altura-border)",
              color: "var(--altura-text-primary)",
            }}
          >
            <span className="text-xs font-mono" style={{ color: "var(--altura-gold)" }}>{selectedFund.ticker}</span>
            {selectedFund.name}
            <ChevronDown className="h-4 w-4 ml-1" style={{ color: "var(--altura-text-muted)" }} />
          </button>

          {showFundDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowFundDropdown(false)} />
              <div
                className="absolute right-0 top-full mt-1 z-20 rounded-lg border py-1 min-w-[220px]"
                style={{ backgroundColor: "var(--altura-navy-elevated)", borderColor: "var(--altura-border)" }}
              >
                {MOCK_FUNDS.map((f) => (
                  <button
                    key={f.id}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-white/5 transition-colors"
                    style={{ color: f.id === selectedFundId ? "var(--altura-gold)" : "var(--altura-text-secondary)" }}
                    onClick={() => { setSelectedFundId(f.id); setShowFundDropdown(false); }}
                  >
                    <span className="font-mono text-xs w-8">{f.ticker}</span>
                    <span>{f.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Content */}
      <div>
        {activeTab === "summary" && <FundsSummaryTab fundId={selectedFundId} />}
        {activeTab === "model" && <ModelPortfolioTab fundId={selectedFundId} />}
        {activeTab === "orders" && <OrdersTab fundId={selectedFundId} />}
      </div>
    </div>
  );
}
