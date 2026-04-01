"use client";

import { useState } from "react";
import { Download, Play, ChevronDown, ChevronRight, Shield, AlertTriangle, XCircle } from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";
import {
  MOCK_COMPLIANCE_RULES,
  MOCK_COMPLIANCE_CHECKS,
  MOCK_AUDIT_LOG,
  type ComplianceRule,
  type ComplianceStatus,
  type AuditAction,
} from "@/lib/mock-data";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<ComplianceStatus, { bg: string; color: string; icon: React.ElementType }> = {
  pass:    { bg: "rgba(34,197,94,0.1)",  color: "var(--status-positive)", icon: Shield },
  warning: { bg: "rgba(245,158,11,0.1)", color: "var(--status-warning)",  icon: AlertTriangle },
  breach:  { bg: "rgba(239,68,68,0.15)", color: "var(--status-negative)", icon: XCircle },
};

const ACTION_STYLE: Record<AuditAction, { bg: string; color: string }> = {
  create:    { bg: "rgba(34,197,94,0.1)",   color: "var(--status-positive)" },
  update:    { bg: "rgba(59,130,246,0.1)",  color: "var(--status-info)" },
  delete:    { bg: "rgba(239,68,68,0.1)",   color: "var(--status-negative)" },
  approve:   { bg: "rgba(34,197,94,0.1)",   color: "var(--status-positive)" },
  reject:    { bg: "rgba(239,68,68,0.1)",   color: "var(--status-negative)" },
  login:     { bg: "rgba(148,163,184,0.1)", color: "var(--altura-text-muted)" },
  export:    { bg: "rgba(197,165,114,0.1)", color: "var(--altura-gold)" },
  run_check: { bg: "rgba(59,130,246,0.1)",  color: "var(--status-info)" },
};

function ComplianceStatusBadge({ status }: { status: ComplianceStatus }) {
  const s = STATUS_STYLE[status];
  const Icon = s.icon;
  return (
    <span className="flex items-center gap-1.5 w-fit rounded-full px-2 py-0.5 text-xs font-medium capitalize" style={{ backgroundColor: s.bg, color: s.color }}>
      <Icon className="h-3 w-3" />
      {status}
    </span>
  );
}

// ─── Tab 1: Dashboard ─────────────────────────────────────────────────────────

function ComplianceDashboardTab() {
  const breaches = MOCK_COMPLIANCE_RULES.filter((r) => r.status === "breach");
  const warnings = MOCK_COMPLIANCE_RULES.filter((r) => r.status === "warning");
  const passes = MOCK_COMPLIANCE_RULES.filter((r) => r.status === "pass");

  const score = Math.round((passes.length / MOCK_COMPLIANCE_RULES.length) * 100);

  const recentChecks = [...MOCK_COMPLIANCE_CHECKS].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Score Row */}
      <div className="grid grid-cols-4 gap-4">
        {/* Score */}
        <div className="altura-card p-5">
          <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--altura-text-muted)" }}>Compliance Score</div>
          <div
            className="text-3xl font-bold"
            style={{ color: score >= 90 ? "var(--status-positive)" : score >= 75 ? "var(--status-warning)" : "var(--status-negative)" }}
          >
            {score}%
          </div>
          <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--altura-border)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${score}%`,
                backgroundColor: score >= 90 ? "var(--status-positive)" : score >= 75 ? "var(--status-warning)" : "var(--status-negative)",
              }}
            />
          </div>
          <div className="text-xs mt-2" style={{ color: "var(--altura-text-muted)" }}>{passes.length}/{MOCK_COMPLIANCE_RULES.length} rules passing</div>
        </div>

        {/* Breaches */}
        <div className="altura-card p-5" style={{ borderColor: breaches.length > 0 ? "rgba(239,68,68,0.3)" : undefined }}>
          <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--altura-text-muted)" }}>Active Breaches</div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold" style={{ color: breaches.length > 0 ? "var(--status-negative)" : "var(--status-positive)" }}>
              {breaches.length}
            </span>
            {breaches.length > 0 && <XCircle className="h-5 w-5 mb-1" style={{ color: "var(--status-negative)" }} />}
          </div>
          <div className="text-xs mt-1 space-y-0.5">
            {breaches.map((b) => (
              <div key={b.id} className="truncate" style={{ color: "var(--status-negative)" }}>{b.name}</div>
            ))}
            {breaches.length === 0 && <div style={{ color: "var(--status-positive)" }}>No active breaches</div>}
          </div>
          <div className="gold-accent-line mt-3" />
        </div>

        {/* Warnings */}
        <div className="altura-card p-5" style={{ borderColor: warnings.length > 0 ? "rgba(245,158,11,0.2)" : undefined }}>
          <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--altura-text-muted)" }}>Warnings</div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold" style={{ color: warnings.length > 0 ? "var(--status-warning)" : "var(--status-positive)" }}>
              {warnings.length}
            </span>
            {warnings.length > 0 && <AlertTriangle className="h-5 w-5 mb-1" style={{ color: "var(--status-warning)" }} />}
          </div>
          <div className="text-xs mt-1 space-y-0.5">
            {warnings.map((w) => (
              <div key={w.id} className="truncate" style={{ color: "var(--status-warning)" }}>{w.name}</div>
            ))}
          </div>
          <div className="gold-accent-line mt-3" />
        </div>

        {/* Last Check */}
        <div className="altura-card p-5">
          <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--altura-text-muted)" }}>Last Check Run</div>
          <div className="text-sm font-semibold" style={{ color: "var(--altura-text-primary)" }}>
            {recentChecks[0]?.date.split(" ")[0]}
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--altura-text-muted)" }}>
            {recentChecks[0]?.date.split(" ")[1]} — {recentChecks[0]?.triggeredBy}
          </div>
          <div className="text-xs mt-2" style={{ color: "var(--altura-text-secondary)" }}>
            {MOCK_COMPLIANCE_CHECKS.length} checks in history
          </div>
          <div className="gold-accent-line mt-3" />
        </div>
      </div>

      {/* Recent Check Timeline */}
      <div className="altura-card">
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--altura-border)" }}>
          <h3 className="text-sm font-semibold" style={{ color: "var(--altura-text-primary)" }}>Recent Compliance Checks</h3>
        </div>
        <div className="px-5 py-4">
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-px" style={{ backgroundColor: "var(--altura-border)" }} />
            <div className="space-y-4">
              {recentChecks.map((check) => {
                const rule = MOCK_COMPLIANCE_RULES.find((r) => r.id === check.ruleId);
                const s = STATUS_STYLE[check.status];
                const Icon = s.icon;
                return (
                  <div key={check.id} className="flex items-start gap-4 pl-8">
                    <div
                      className="absolute left-0 flex h-6 w-6 items-center justify-center rounded-full border"
                      style={{ backgroundColor: s.bg, borderColor: s.color }}
                    >
                      <Icon className="h-3 w-3" style={{ color: s.color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium" style={{ color: "var(--altura-text-primary)" }}>
                          {rule?.name ?? check.ruleId}
                        </span>
                        <ComplianceStatusBadge status={check.status} />
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--altura-text-muted)" }}>
                        {check.date} · {check.triggeredBy}
                      </div>
                      {check.notes && (
                        <div className="text-xs mt-1" style={{ color: "var(--altura-text-secondary)" }}>{check.notes}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 2: Rules & Checks ────────────────────────────────────────────────────

function RulesTab() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [running, setRunning] = useState(false);

  const filtered = filterStatus === "all"
    ? MOCK_COMPLIANCE_RULES
    : MOCK_COMPLIANCE_RULES.filter((r) => r.status === filterStatus);

  const runChecks = () => {
    setRunning(true);
    setTimeout(() => setRunning(false), 2000);
  };

  const TYPE_LABELS: Record<string, string> = {
    concentration: "Concentration",
    asset_class: "Asset Class",
    liquidity: "Liquidity",
    custom: "Custom",
  };

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {["all", "breach", "warning", "pass"].map((s) => (
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
              {s === "all" ? `All (${MOCK_COMPLIANCE_RULES.length})` : `${s} (${MOCK_COMPLIANCE_RULES.filter((r) => r.status === s).length})`}
            </button>
          ))}
        </div>
        <button
          onClick={runChecks}
          disabled={running}
          className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-opacity"
          style={{
            backgroundColor: "var(--altura-gold)",
            color: "var(--altura-navy)",
            opacity: running ? 0.7 : 1,
          }}
        >
          <Play className="h-3.5 w-3.5" />
          {running ? "Running…" : "Run All Checks"}
        </button>
      </div>

      {/* Rules Table */}
      <div className="altura-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid var(--altura-border)` }}>
                {["Rule", "Type", "Fund", "Severity", "Threshold", "Current Value", "Last Checked", "Status"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--altura-text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((rule, i) => {
                const isExpanded = expandedId === rule.id;
                const sevColor = rule.severity === "high" ? "var(--status-negative)" : rule.severity === "medium" ? "var(--status-warning)" : "var(--altura-text-muted)";
                return (
                  <>
                    <tr
                      key={rule.id}
                      className="cursor-pointer hover:bg-white/[0.02] transition-colors"
                      style={{
                        borderBottom: (!isExpanded && i < filtered.length - 1) ? `1px solid var(--altura-border)` : undefined,
                        backgroundColor: rule.status === "breach" ? "rgba(239,68,68,0.03)" : undefined,
                      }}
                      onClick={() => setExpandedId(isExpanded ? null : rule.id)}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "var(--altura-text-muted)" }} /> : <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "var(--altura-text-muted)" }} />}
                          <span className="font-medium" style={{ color: "var(--altura-text-primary)" }}>{rule.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: "rgba(59,130,246,0.1)", color: "var(--status-info)" }}>
                          {TYPE_LABELS[rule.type]}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-mono text-xs" style={{ color: "var(--altura-gold)" }}>
                          {rule.fundId === "all" ? "All Funds" : rule.fundId.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="capitalize text-xs font-medium" style={{ color: sevColor }}>{rule.severity}</span>
                      </td>
                      <td className="px-5 py-3 text-xs" style={{ color: "var(--altura-text-secondary)" }}>{rule.threshold}</td>
                      <td className="px-5 py-3 text-xs font-medium" style={{ color: rule.status === "pass" ? "var(--altura-text-secondary)" : STATUS_STYLE[rule.status].color }}>
                        {rule.currentValue}
                      </td>
                      <td className="px-5 py-3 text-xs" style={{ color: "var(--altura-text-muted)" }}>{rule.lastChecked}</td>
                      <td className="px-5 py-3"><ComplianceStatusBadge status={rule.status} /></td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${rule.id}-detail`} style={{ borderBottom: i < filtered.length - 1 ? `1px solid var(--altura-border)` : undefined }}>
                        <td colSpan={8} className="px-5 py-4" style={{ backgroundColor: "var(--altura-navy-elevated)" }}>
                          <div className="text-xs space-y-2">
                            <div>
                              <span className="font-medium" style={{ color: "var(--altura-text-secondary)" }}>Description: </span>
                              <span style={{ color: "var(--altura-text-muted)" }}>{rule.description}</span>
                            </div>
                            <div>
                              <span className="font-medium mb-1 block" style={{ color: "var(--altura-text-secondary)" }}>Recent Check History:</span>
                              <div className="space-y-1">
                                {MOCK_COMPLIANCE_CHECKS.filter((c) => c.ruleId === rule.id).map((c) => (
                                  <div key={c.id} className="flex items-center gap-3">
                                    <span style={{ color: "var(--altura-text-muted)" }}>{c.date}</span>
                                    <ComplianceStatusBadge status={c.status} />
                                    {c.notes && <span style={{ color: "var(--altura-text-muted)" }}>{c.notes}</span>}
                                  </div>
                                ))}
                                {MOCK_COMPLIANCE_CHECKS.filter((c) => c.ruleId === rule.id).length === 0 && (
                                  <span style={{ color: "var(--altura-text-muted)" }}>No check history available</span>
                                )}
                              </div>
                            </div>
                          </div>
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

// ─── Tab 3: Audit Log ─────────────────────────────────────────────────────────

function AuditLogTab() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterUser, setFilterUser] = useState("all");
  const [filterAction, setFilterAction] = useState("all");

  const users = ["all", ...Array.from(new Set(MOCK_AUDIT_LOG.map((e) => e.user)))];
  const actions: ("all" | AuditAction)[] = ["all", "create", "update", "delete", "approve", "reject", "login", "export", "run_check"];

  const filtered = MOCK_AUDIT_LOG.filter((e) => {
    if (filterUser !== "all" && e.user !== filterUser) return false;
    if (filterAction !== "all" && e.action !== filterAction) return false;
    return true;
  });

  const exportCSV = () => {
    const header = "Timestamp,User,Role,Action,Entity,EntityID,Details\n";
    const rows = filtered.map((e) => `"${e.timestamp}","${e.user}","${e.userRole}","${e.action}","${e.entity}","${e.entityId}","${e.details}"`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_log_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs" style={{ color: "var(--altura-text-muted)" }}>User:</label>
          <select
            className="rounded border px-2 py-1 text-xs"
            style={{ backgroundColor: "var(--altura-navy-surface)", borderColor: "var(--altura-border)", color: "var(--altura-text-secondary)" }}
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
          >
            {users.map((u) => <option key={u} value={u}>{u === "all" ? "All Users" : u}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs" style={{ color: "var(--altura-text-muted)" }}>Action:</label>
          <select
            className="rounded border px-2 py-1 text-xs capitalize"
            style={{ backgroundColor: "var(--altura-navy-surface)", borderColor: "var(--altura-border)", color: "var(--altura-text-secondary)" }}
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
          >
            {actions.map((a) => <option key={a} value={a}>{a === "all" ? "All Actions" : a}</option>)}
          </select>
        </div>
        <div className="ml-auto">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium border"
            style={{ borderColor: "var(--altura-border)", color: "var(--altura-gold)", backgroundColor: "rgba(197,165,114,0.08)" }}
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Audit Table */}
      <div className="altura-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid var(--altura-border)` }}>
                {["Timestamp", "User", "Role", "Action", "Entity", "Details"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--altura-text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry, i) => {
                const actionStyle = ACTION_STYLE[entry.action];
                const isExpanded = expandedId === entry.id;
                return (
                  <>
                    <tr
                      key={entry.id}
                      className="cursor-pointer hover:bg-white/[0.02] transition-colors"
                      style={{ borderBottom: (!isExpanded && i < filtered.length - 1) ? `1px solid var(--altura-border)` : undefined }}
                      onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    >
                      <td className="px-5 py-3 text-xs font-mono" style={{ color: "var(--altura-text-muted)" }}>{entry.timestamp}</td>
                      <td className="px-5 py-3 text-xs font-medium" style={{ color: "var(--altura-text-primary)" }}>{entry.user}</td>
                      <td className="px-5 py-3 text-xs" style={{ color: "var(--altura-text-muted)" }}>{entry.userRole}</td>
                      <td className="px-5 py-3">
                        <span className="rounded-full px-2 py-0.5 text-xs font-medium capitalize" style={{ backgroundColor: actionStyle.bg, color: actionStyle.color }}>
                          {entry.action.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs" style={{ color: "var(--altura-text-secondary)" }}>
                        <span className="capitalize">{entry.entity.replace(/_/g, " ")}</span>
                        {" "}
                        <span className="font-mono" style={{ color: "var(--altura-text-muted)" }}>{entry.entityId}</span>
                      </td>
                      <td className="px-5 py-3 text-xs" style={{ color: "var(--altura-text-muted)", maxWidth: 280 }}>
                        <span className="block truncate">{entry.details}</span>
                      </td>
                    </tr>
                    {isExpanded && (entry.oldValue || entry.newValue) && (
                      <tr key={`${entry.id}-detail`} style={{ borderBottom: i < filtered.length - 1 ? `1px solid var(--altura-border)` : undefined }}>
                        <td colSpan={6} className="px-5 py-3" style={{ backgroundColor: "var(--altura-navy-elevated)" }}>
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            {entry.oldValue && (
                              <div>
                                <div className="font-medium mb-1" style={{ color: "var(--status-negative)" }}>Before</div>
                                <pre className="rounded p-2 font-mono overflow-x-auto text-xs" style={{ backgroundColor: "rgba(239,68,68,0.08)", color: "var(--altura-text-secondary)" }}>
                                  {entry.oldValue}
                                </pre>
                              </div>
                            )}
                            {entry.newValue && (
                              <div>
                                <div className="font-medium mb-1" style={{ color: "var(--status-positive)" }}>After</div>
                                <pre className="rounded p-2 font-mono overflow-x-auto text-xs" style={{ backgroundColor: "rgba(34,197,94,0.08)", color: "var(--altura-text-secondary)" }}>
                                  {entry.newValue}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t text-xs" style={{ borderColor: "var(--altura-border)", color: "var(--altura-text-muted)" }}>
          Showing {filtered.length} of {MOCK_AUDIT_LOG.length} entries
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "rules", label: "Rules & Checks" },
  { id: "audit", label: "Audit Log" },
];

export default function CompliancePage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const breachCount = MOCK_COMPLIANCE_RULES.filter((r) => r.status === "breach").length;
  const warningCount = MOCK_COMPLIANCE_RULES.filter((r) => r.status === "warning").length;

  const tabs = TABS.map((t) => ({
    ...t,
    badge: t.id === "rules" && breachCount > 0 ? breachCount : undefined,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--altura-text-primary)" }}>Compliance</h1>
          <p className="text-sm mt-1" style={{ color: "var(--altura-text-secondary)" }}>Regulatory monitoring and audit trail</p>
        </div>
        <div className="flex items-center gap-2">
          {breachCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: "rgba(239,68,68,0.15)", color: "var(--status-negative)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <XCircle className="h-3.5 w-3.5" />
              {breachCount} breach{breachCount > 1 ? "es" : ""}
            </span>
          )}
          {warningCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: "rgba(245,158,11,0.15)", color: "var(--status-warning)", border: "1px solid rgba(245,158,11,0.3)" }}>
              <AlertTriangle className="h-3.5 w-3.5" />
              {warningCount} warning{warningCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div>
        {activeTab === "dashboard" && <ComplianceDashboardTab />}
        {activeTab === "rules" && <RulesTab />}
        {activeTab === "audit" && <AuditLogTab />}
      </div>
    </div>
  );
}
