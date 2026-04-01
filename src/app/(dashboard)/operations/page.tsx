"use client";

import { useState } from "react";
import { CheckSquare, Square, Upload, AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";
import {
  MOCK_FUNDS,
  MOCK_SETTLEMENTS,
  MOCK_CASH_MOVEMENTS,
  MOCK_IMPORT_BATCHES,
  MOCK_DAILY_TASKS,
  formatNZD,
  formatDate,
  type DailyTask,
  type CashMovementType,
  type ImportStatus,
} from "@/lib/mock-data";

// ─── Shared helpers ───────────────────────────────────────────────────────────

const SETTLEMENT_STATUS_STYLE: Record<string, { bg: string; color: string; icon: React.ElementType }> = {
  pending:  { bg: "rgba(245,158,11,0.1)",  color: "var(--status-warning)",  icon: Clock },
  settled:  { bg: "rgba(34,197,94,0.1)",   color: "var(--status-positive)", icon: CheckCircle },
  failed:   { bg: "rgba(239,68,68,0.1)",   color: "var(--status-negative)", icon: XCircle },
  overdue:  { bg: "rgba(239,68,68,0.15)",  color: "var(--status-negative)", icon: AlertCircle },
};

const IMPORT_STATUS_STYLE: Record<ImportStatus, { bg: string; color: string }> = {
  success:    { bg: "rgba(34,197,94,0.1)",   color: "var(--status-positive)" },
  failed:     { bg: "rgba(239,68,68,0.1)",   color: "var(--status-negative)" },
  partial:    { bg: "rgba(245,158,11,0.1)",  color: "var(--status-warning)" },
  processing: { bg: "rgba(59,130,246,0.1)",  color: "var(--status-info)" },
};

const MOVEMENT_TYPE_STYLE: Record<CashMovementType, { bg: string; color: string }> = {
  investment:  { bg: "rgba(34,197,94,0.1)",  color: "var(--status-positive)" },
  redemption:  { bg: "rgba(239,68,68,0.1)",  color: "var(--status-negative)" },
  dividend:    { bg: "rgba(197,165,114,0.1)", color: "var(--altura-gold)" },
  interest:    { bg: "rgba(197,165,114,0.1)", color: "var(--altura-gold-muted)" },
  fee:         { bg: "rgba(239,68,68,0.08)", color: "var(--status-negative)" },
  settlement:  { bg: "rgba(59,130,246,0.1)",  color: "var(--status-info)" },
};

function StatusBadge({ status, style }: { status: string; style: { bg: string; color: string } }) {
  return (
    <span className="rounded-full px-2 py-0.5 text-xs font-medium capitalize" style={{ backgroundColor: style.bg, color: style.color }}>
      {status}
    </span>
  );
}

// ─── Tab 1: Daily Dashboard ───────────────────────────────────────────────────

function DailyDashboardTab() {
  const [tasks, setTasks] = useState<DailyTask[]>(MOCK_DAILY_TASKS);

  const toggle = (id: string) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const pendingHigh = tasks.filter((t) => !t.done && t.priority === "high").length;
  const lastImport = MOCK_IMPORT_BATCHES[0];
  const overdueSettlements = MOCK_SETTLEMENTS.filter((s) => s.status === "overdue");
  const failedSettlements = MOCK_SETTLEMENTS.filter((s) => s.status === "failed");

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Task Checklist */}
      <div className="col-span-2 altura-card">
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--altura-border)" }}>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--altura-text-primary)" }}>Today's Tasks</h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--altura-text-muted)" }}>
              {tasks.filter((t) => t.done).length}/{tasks.length} complete
            </p>
          </div>
          {pendingHigh > 0 && (
            <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: "rgba(239,68,68,0.15)", color: "var(--status-negative)" }}>
              {pendingHigh} urgent
            </span>
          )}
        </div>
        <ul className="divide-y" style={{ borderColor: "var(--altura-border)" }}>
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
              onClick={() => toggle(task.id)}
            >
              {task.done
                ? <CheckSquare className="h-4 w-4 flex-shrink-0" style={{ color: "var(--status-positive)" }} />
                : <Square className="h-4 w-4 flex-shrink-0" style={{ color: "var(--altura-text-muted)" }} />}
              <span
                className="flex-1 text-sm"
                style={{
                  color: task.done ? "var(--altura-text-muted)" : "var(--altura-text-primary)",
                  textDecoration: task.done ? "line-through" : undefined,
                }}
              >
                {task.label}
              </span>
              {!task.done && task.priority === "high" && (
                <span className="text-xs rounded px-1.5 py-0.5" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "var(--status-negative)" }}>High</span>
              )}
              {task.dueTime && !task.done && (
                <span className="text-xs" style={{ color: "var(--altura-text-muted)" }}>{task.dueTime}</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Status Cards */}
      <div className="space-y-4">
        {/* Data Import Status */}
        <div className="altura-card p-4">
          <div className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "var(--altura-text-muted)" }}>Last Data Import</div>
          <div className="flex items-center gap-2 mb-1">
            {lastImport.status === "success"
              ? <CheckCircle className="h-4 w-4" style={{ color: "var(--status-positive)" }} />
              : <AlertCircle className="h-4 w-4" style={{ color: "var(--status-warning)" }} />}
            <span className="text-sm font-medium" style={{ color: "var(--altura-text-primary)" }}>{lastImport.source}</span>
          </div>
          <div className="text-xs mb-2" style={{ color: "var(--altura-text-muted)" }}>{lastImport.date}</div>
          <div className="text-xs" style={{ color: "var(--altura-text-secondary)" }}>
            {lastImport.rowsProcessed} rows — {lastImport.errors === 0 ? "No errors" : `${lastImport.errors} errors`}
          </div>
          <div className="gold-accent-line mt-3" />
        </div>

        {/* Outstanding Settlements */}
        <div className="altura-card p-4">
          <div className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "var(--altura-text-muted)" }}>Outstanding Settlements</div>
          <div className="space-y-2">
            {overdueSettlements.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: "var(--status-negative)" }}>Overdue</span>
                <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ backgroundColor: "rgba(239,68,68,0.15)", color: "var(--status-negative)" }}>
                  {overdueSettlements.length}
                </span>
              </div>
            )}
            {failedSettlements.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: "var(--status-negative)" }}>Failed</span>
                <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "var(--status-negative)" }}>
                  {failedSettlements.length}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: "var(--altura-text-secondary)" }}>Pending T+2</span>
              <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ backgroundColor: "rgba(245,158,11,0.1)", color: "var(--status-warning)" }}>
                {MOCK_SETTLEMENTS.filter((s) => s.status === "pending").length}
              </span>
            </div>
          </div>
          <div className="gold-accent-line mt-3" />
        </div>

        {/* Fund Cash Summary */}
        <div className="altura-card p-4">
          <div className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "var(--altura-text-muted)" }}>Cash by Fund</div>
          <div className="space-y-2">
            {MOCK_FUNDS.map((f) => (
              <div key={f.id} className="flex items-center justify-between">
                <span className="text-xs font-mono" style={{ color: "var(--altura-gold)" }}>{f.ticker}</span>
                <span className="text-xs" style={{ color: "var(--altura-text-secondary)" }}>{formatNZD(f.cashBalance, true)}</span>
              </div>
            ))}
          </div>
          <div className="gold-accent-line mt-3" />
        </div>
      </div>
    </div>
  );
}

// ─── Tab 2: Settlements ───────────────────────────────────────────────────────

function SettlementsTab() {
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = filterStatus === "all"
    ? MOCK_SETTLEMENTS
    : MOCK_SETTLEMENTS.filter((s) => s.status === filterStatus);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2">
        {["all", "pending", "overdue", "failed", "settled"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className="rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors"
            style={{
              backgroundColor: filterStatus === s ? "rgba(197,165,114,0.15)" : "rgba(255,255,255,0.04)",
              color: filterStatus === s ? "var(--altura-gold)" : "var(--altura-text-muted)",
              border: `1px solid ${filterStatus === s ? "var(--altura-gold-muted)" : "transparent"}`,
            }}
          >
            {s === "all" ? `All (${MOCK_SETTLEMENTS.length})` : s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="altura-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid var(--altura-border)` }}>
                {["ID", "Security", "Fund", "Trade Date", "Settlement Date", "Amount", "Counterparty", "Status"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--altura-text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const style = SETTLEMENT_STATUS_STYLE[s.status];
                const Icon = style.icon;
                return (
                  <tr
                    key={s.id}
                    style={{
                      borderBottom: i < filtered.length - 1 ? `1px solid var(--altura-border)` : undefined,
                      backgroundColor: (s.status === "overdue" || s.status === "failed") ? "rgba(239,68,68,0.03)" : undefined,
                    }}
                  >
                    <td className="px-5 py-3 font-mono text-xs" style={{ color: "var(--altura-text-muted)" }}>{s.id}</td>
                    <td className="px-5 py-3 font-medium" style={{ color: "var(--altura-text-primary)" }}>{s.security}</td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs" style={{ color: "var(--altura-gold)" }}>
                        {MOCK_FUNDS.find((f) => f.id === s.fundId)?.ticker ?? s.fundId}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: "var(--altura-text-secondary)" }}>{formatDate(s.tradeDate)}</td>
                    <td className="px-5 py-3 text-xs" style={{ color: (s.status === "overdue" || s.status === "failed") ? "var(--status-negative)" : "var(--altura-text-secondary)" }}>
                      {formatDate(s.settlementDate)}
                    </td>
                    <td className="px-5 py-3 font-medium" style={{ color: "var(--altura-text-primary)" }}>{formatNZD(s.amount)}</td>
                    <td className="px-5 py-3 text-xs" style={{ color: "var(--altura-text-secondary)" }}>{s.counterparty}</td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-1.5 w-fit rounded-full px-2 py-0.5 text-xs font-medium capitalize" style={{ backgroundColor: style.bg, color: style.color }}>
                        <Icon className="h-3 w-3" />
                        {s.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 3: Cash Management ───────────────────────────────────────────────────

function CashManagementTab() {
  const [showForm, setShowForm] = useState(false);
  const [movements, setMovements] = useState(MOCK_CASH_MOVEMENTS);
  const [form, setForm] = useState({ fundId: "agf", type: "investment" as CashMovementType, amount: "", counterparty: "", notes: "" });

  const handleAdd = () => {
    setMovements((prev) => [{
      id: `CM-${String(Date.now()).slice(-3)}`,
      date: new Date().toISOString().slice(0, 10),
      fundId: form.fundId,
      type: form.type,
      amount: form.type === "redemption" || form.type === "fee" ? -(parseFloat(form.amount) || 0) : (parseFloat(form.amount) || 0),
      currency: "NZD",
      counterparty: form.counterparty,
      status: "pending" as const,
      notes: form.notes || undefined,
    }, ...prev]);
    setShowForm(false);
    setForm({ fundId: "agf", type: "investment", amount: "", counterparty: "", notes: "" });
  };

  return (
    <div className="space-y-4">
      {/* Cash Balance Summary */}
      <div className="grid grid-cols-3 gap-4">
        {MOCK_FUNDS.map((f) => (
          <div key={f.id} className="altura-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-medium" style={{ color: "var(--altura-gold)" }}>{f.ticker}</span>
              <span className="text-xs" style={{ color: "var(--altura-text-muted)" }}>NZD</span>
            </div>
            <div className="text-xl font-semibold" style={{ color: "var(--altura-text-primary)" }}>{formatNZD(f.cashBalance, true)}</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--altura-text-muted)" }}>{((f.cashBalance / f.aum) * 100).toFixed(1)}% of AUM</div>
            <div className="gold-accent-line mt-3" />
          </div>
        ))}
      </div>

      {/* Add Movement */}
      <div className="altura-card overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--altura-border)" }}>
          <h3 className="text-sm font-semibold" style={{ color: "var(--altura-text-primary)" }}>Cash Movements</h3>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-md px-3 py-1.5 text-xs font-medium"
            style={{ backgroundColor: "var(--altura-gold)", color: "var(--altura-navy)" }}
          >
            + Add Movement
          </button>
        </div>

        {showForm && (
          <div className="px-5 py-4 border-b grid grid-cols-2 gap-4" style={{ borderColor: "var(--altura-border)", backgroundColor: "var(--altura-navy-elevated)" }}>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--altura-text-secondary)" }}>Fund</label>
              <select className="w-full rounded border px-3 py-2 text-sm" style={{ backgroundColor: "var(--altura-navy-surface)", borderColor: "var(--altura-border)", color: "var(--altura-text-primary)" }} value={form.fundId} onChange={(e) => setForm((f) => ({ ...f, fundId: e.target.value }))}>
                {MOCK_FUNDS.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--altura-text-secondary)" }}>Type</label>
              <select className="w-full rounded border px-3 py-2 text-sm capitalize" style={{ backgroundColor: "var(--altura-navy-surface)", borderColor: "var(--altura-border)", color: "var(--altura-text-primary)" }} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as CashMovementType }))}>
                {(["investment", "redemption", "dividend", "interest", "fee", "settlement"] as CashMovementType[]).map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--altura-text-secondary)" }}>Amount (NZD)</label>
              <input type="number" placeholder="0.00" className="w-full rounded border px-3 py-2 text-sm" style={{ backgroundColor: "var(--altura-navy-surface)", borderColor: "var(--altura-border)", color: "var(--altura-text-primary)" }} value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--altura-text-secondary)" }}>Counterparty</label>
              <input type="text" placeholder="Counterparty name" className="w-full rounded border px-3 py-2 text-sm" style={{ backgroundColor: "var(--altura-navy-surface)", borderColor: "var(--altura-border)", color: "var(--altura-text-primary)" }} value={form.counterparty} onChange={(e) => setForm((f) => ({ ...f, counterparty: e.target.value }))} />
            </div>
            <div className="col-span-2 flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="rounded px-3 py-1.5 text-xs border" style={{ borderColor: "var(--altura-border)", color: "var(--altura-text-secondary)" }}>Cancel</button>
              <button onClick={handleAdd} className="rounded px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: "var(--altura-gold)", color: "var(--altura-navy)" }}>Save</button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid var(--altura-border)` }}>
                {["Date", "Fund", "Type", "Amount", "Counterparty", "Status"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--altura-text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {movements.map((m, i) => {
                const typeStyle = MOVEMENT_TYPE_STYLE[m.type];
                return (
                  <tr key={m.id} style={{ borderBottom: i < movements.length - 1 ? `1px solid var(--altura-border)` : undefined }}>
                    <td className="px-5 py-3 text-xs" style={{ color: "var(--altura-text-muted)" }}>{formatDate(m.date)}</td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs" style={{ color: "var(--altura-gold)" }}>
                        {MOCK_FUNDS.find((f) => f.id === m.fundId)?.ticker ?? m.fundId}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={m.type} style={typeStyle} />
                    </td>
                    <td className="px-5 py-3 font-medium" style={{ color: m.amount < 0 ? "var(--status-negative)" : "var(--status-positive)" }}>
                      {m.amount < 0 ? "-" : "+"}{formatNZD(Math.abs(m.amount))}
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: "var(--altura-text-secondary)" }}>{m.counterparty}</td>
                    <td className="px-5 py-3">
                      <StatusBadge
                        status={m.status}
                        style={m.status === "processed"
                          ? { bg: "rgba(34,197,94,0.1)", color: "var(--status-positive)" }
                          : m.status === "failed"
                          ? { bg: "rgba(239,68,68,0.1)", color: "var(--status-negative)" }
                          : { bg: "rgba(245,158,11,0.1)", color: "var(--status-warning)" }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 4: Data Imports ──────────────────────────────────────────────────────

function DataImportsTab() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        className="rounded-xl border-2 border-dashed p-8 text-center transition-colors"
        style={{
          borderColor: isDragging ? "var(--altura-gold)" : "var(--altura-border)",
          backgroundColor: isDragging ? "rgba(197,165,114,0.05)" : "var(--altura-navy-surface)",
        }}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => setIsDragging(false)}
      >
        <Upload className="h-8 w-8 mx-auto mb-3" style={{ color: isDragging ? "var(--altura-gold)" : "var(--altura-text-muted)" }} />
        <p className="text-sm font-medium mb-1" style={{ color: "var(--altura-text-primary)" }}>Drop CSV file here or click to upload</p>
        <p className="text-xs" style={{ color: "var(--altura-text-muted)" }}>Supports NZX prices, custodian holdings, Bloomberg rates</p>
        <button
          className="mt-4 rounded-md px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: "rgba(197,165,114,0.15)", color: "var(--altura-gold)", border: "1px solid var(--altura-gold-muted)" }}
        >
          Browse Files
        </button>
      </div>

      {/* Import History */}
      <div className="altura-card overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--altura-border)" }}>
          <h3 className="text-sm font-semibold" style={{ color: "var(--altura-text-primary)" }}>Import History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid var(--altura-border)` }}>
                {["Date", "Source", "File", "Status", "Rows", "Errors"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--altura-text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_IMPORT_BATCHES.map((batch, i) => {
                const s = IMPORT_STATUS_STYLE[batch.status];
                const isExpanded = expandedId === batch.id;
                return (
                  <>
                    <tr
                      key={batch.id}
                      className="cursor-pointer hover:bg-white/[0.02] transition-colors"
                      style={{ borderBottom: (!isExpanded && i < MOCK_IMPORT_BATCHES.length - 1) ? `1px solid var(--altura-border)` : undefined }}
                      onClick={() => setExpandedId(isExpanded ? null : batch.id)}
                    >
                      <td className="px-5 py-3 text-xs" style={{ color: "var(--altura-text-muted)" }}>{batch.date}</td>
                      <td className="px-5 py-3 font-medium" style={{ color: "var(--altura-text-primary)" }}>{batch.source}</td>
                      <td className="px-5 py-3 font-mono text-xs" style={{ color: "var(--altura-text-secondary)" }}>{batch.fileName}</td>
                      <td className="px-5 py-3">
                        <span className="rounded-full px-2 py-0.5 text-xs font-medium capitalize" style={{ backgroundColor: s.bg, color: s.color }}>
                          {batch.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs" style={{ color: "var(--altura-text-secondary)" }}>{batch.rowsProcessed}/{batch.rowsTotal}</td>
                      <td className="px-5 py-3 text-xs" style={{ color: batch.errors > 0 ? "var(--status-negative)" : "var(--altura-text-muted)" }}>
                        {batch.errors > 0 ? batch.errors : "—"}
                      </td>
                    </tr>
                    {isExpanded && batch.errorLog && (
                      <tr key={`${batch.id}-log`} style={{ borderBottom: i < MOCK_IMPORT_BATCHES.length - 1 ? `1px solid var(--altura-border)` : undefined }}>
                        <td colSpan={6} className="px-5 py-3" style={{ backgroundColor: "rgba(239,68,68,0.04)" }}>
                          <div className="text-xs font-medium mb-2" style={{ color: "var(--status-negative)" }}>Error Log</div>
                          <ul className="space-y-1">
                            {batch.errorLog.map((err, j) => (
                              <li key={j} className="flex items-start gap-2 text-xs font-mono" style={{ color: "var(--altura-text-muted)" }}>
                                <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" style={{ color: "var(--status-negative)" }} />
                                {err}
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "daily", label: "Daily Dashboard" },
  { id: "settlements", label: "Settlements" },
  { id: "cash", label: "Cash Management" },
  { id: "imports", label: "Data Imports" },
];

export const metadata = { title: "Operations" };

export default function OperationsPage() {
  const [activeTab, setActiveTab] = useState("daily");

  const overdueCount = MOCK_SETTLEMENTS.filter((s) => s.status === "overdue").length;
  const failedCount = MOCK_SETTLEMENTS.filter((s) => s.status === "failed").length;
  const alertCount = overdueCount + failedCount;

  const tabs = TABS.map((t) => ({
    ...t,
    badge: t.id === "settlements" && alertCount > 0 ? alertCount : undefined,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--altura-text-primary)" }}>Operations</h1>
        <p className="text-sm mt-1" style={{ color: "var(--altura-text-secondary)" }}>Daily operations, settlements, and cash management</p>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div>
        {activeTab === "daily" && <DailyDashboardTab />}
        {activeTab === "settlements" && <SettlementsTab />}
        {activeTab === "cash" && <CashManagementTab />}
        {activeTab === "imports" && <DataImportsTab />}
      </div>
    </div>
  );
}
