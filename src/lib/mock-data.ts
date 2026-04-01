// Altura Capital — Mock Data
// NZD currency, NZX securities

export const MOCK_FUNDS = [
  { id: "agf", name: "Altura Growth Fund", ticker: "AGF", aum: 842_500_000, nav: 1.4872, navDate: "2026-04-01", cashBalance: 28_340_000, currency: "NZD" },
  { id: "aif", name: "Altura Income Fund", ticker: "AIF", aum: 1_120_000_000, nav: 1.2341, navDate: "2026-04-01", cashBalance: 41_200_000, currency: "NZD" },
  { id: "abf", name: "Altura Balanced Fund", ticker: "ABF", aum: 437_800_000, nav: 1.1056, navDate: "2026-04-01", cashBalance: 15_780_000, currency: "NZD" },
];

// ─── Cash Projections (5-day forward) ───────────────────────────────────────

export const MOCK_CASH_PROJECTIONS: Record<string, CashProjection[]> = {
  agf: [
    { date: "2026-04-01", openingCash: 28_340_000, inflows: 2_500_000, outflows: 1_200_000, settlements: -3_800_000, projectedBalance: 25_840_000 },
    { date: "2026-04-02", openingCash: 25_840_000, inflows: 1_800_000, outflows: 4_200_000, settlements: 2_100_000, projectedBalance: 25_540_000 },
    { date: "2026-04-03", openingCash: 25_540_000, inflows: 5_000_000, outflows: 800_000, settlements: -1_500_000, projectedBalance: 28_240_000 },
    { date: "2026-04-04", openingCash: 28_240_000, inflows: 0, outflows: 3_100_000, settlements: 800_000, projectedBalance: 25_940_000 },
    { date: "2026-04-07", openingCash: 25_940_000, inflows: 3_200_000, outflows: 1_600_000, settlements: -2_400_000, projectedBalance: 25_140_000 },
  ],
  aif: [
    { date: "2026-04-01", openingCash: 41_200_000, inflows: 8_000_000, outflows: 2_500_000, settlements: -5_200_000, projectedBalance: 41_500_000 },
    { date: "2026-04-02", openingCash: 41_500_000, inflows: 1_200_000, outflows: 6_800_000, settlements: 3_100_000, projectedBalance: 39_000_000 },
    { date: "2026-04-03", openingCash: 39_000_000, inflows: 4_500_000, outflows: 1_200_000, settlements: -800_000, projectedBalance: 41_500_000 },
    { date: "2026-04-04", openingCash: 41_500_000, inflows: 0, outflows: 4_200_000, settlements: 2_200_000, projectedBalance: 39_500_000 },
    { date: "2026-04-07", openingCash: 39_500_000, inflows: 6_000_000, outflows: 2_100_000, settlements: -3_600_000, projectedBalance: 39_800_000 },
  ],
  abf: [
    { date: "2026-04-01", openingCash: 15_780_000, inflows: 1_200_000, outflows: 600_000, settlements: -1_800_000, projectedBalance: 14_580_000 },
    { date: "2026-04-02", openingCash: 14_580_000, inflows: 800_000, outflows: 2_100_000, settlements: 1_400_000, projectedBalance: 14_680_000 },
    { date: "2026-04-03", openingCash: 14_680_000, inflows: 2_000_000, outflows: 400_000, settlements: -600_000, projectedBalance: 15_680_000 },
    { date: "2026-04-04", openingCash: 15_680_000, inflows: 0, outflows: 1_300_000, settlements: 700_000, projectedBalance: 15_080_000 },
    { date: "2026-04-07", openingCash: 15_080_000, inflows: 1_500_000, outflows: 800_000, settlements: -900_000, projectedBalance: 14_880_000 },
  ],
};

export interface CashProjection {
  date: string;
  openingCash: number;
  inflows: number;
  outflows: number;
  settlements: number;
  projectedBalance: number;
}

// ─── Model Portfolio ─────────────────────────────────────────────────────────

export interface ModelHolding {
  id: string;
  security: string;
  assetClass: string;
  targetPct: number;
  actualPct: number;
  driftPct: number;
  marketValue: number;
}

export const MOCK_MODEL_PORTFOLIO: Record<string, ModelHolding[]> = {
  agf: [
    { id: "1", security: "Fisher & Paykel Healthcare (FPH.NZ)", assetClass: "Equity", targetPct: 12.0, actualPct: 13.4, driftPct: 1.4, marketValue: 112_895_000 },
    { id: "2", security: "Auckland Airport (AIA.NZ)", assetClass: "Equity", targetPct: 8.0, actualPct: 7.2, driftPct: -0.8, marketValue: 60_660_000 },
    { id: "3", security: "Meridian Energy (MEL.NZ)", assetClass: "Equity", targetPct: 7.0, actualPct: 6.8, driftPct: -0.2, marketValue: 57_290_000 },
    { id: "4", security: "ANZ Bank NZ (ANZ.NZ)", assetClass: "Equity", targetPct: 10.0, actualPct: 11.2, driftPct: 1.2, marketValue: 94_360_000 },
    { id: "5", security: "Spark New Zealand (SPK.NZ)", assetClass: "Equity", targetPct: 6.0, actualPct: 5.4, driftPct: -0.6, marketValue: 45_495_000 },
    { id: "6", security: "Mainfreight (MFT.NZ)", assetClass: "Equity", targetPct: 5.0, actualPct: 5.8, driftPct: 0.8, marketValue: 48_865_000 },
    { id: "7", security: "NZ Govt Bond 2028", assetClass: "Fixed Income", targetPct: 15.0, actualPct: 14.2, driftPct: -0.8, marketValue: 119_635_000 },
    { id: "8", security: "NZ Govt Bond 2031", assetClass: "Fixed Income", targetPct: 10.0, actualPct: 9.6, driftPct: -0.4, marketValue: 80_880_000 },
    { id: "9", security: "Cash & Equivalents", assetClass: "Cash", targetPct: 5.0, actualPct: 3.4, driftPct: -1.6, marketValue: 28_645_000 },
    { id: "10", security: "Other / Derivatives", assetClass: "Derivatives", targetPct: 2.0, actualPct: 1.8, driftPct: -0.2, marketValue: 15_165_000 },
  ],
  aif: [
    { id: "1", security: "NZ Govt Bond 2028", assetClass: "Fixed Income", targetPct: 20.0, actualPct: 21.4, driftPct: 1.4, marketValue: 239_680_000 },
    { id: "2", security: "NZ Govt Bond 2031", assetClass: "Fixed Income", targetPct: 15.0, actualPct: 14.8, driftPct: -0.2, marketValue: 165_760_000 },
    { id: "3", security: "Westpac NZ Bond 2027", assetClass: "Fixed Income", targetPct: 10.0, actualPct: 9.6, driftPct: -0.4, marketValue: 107_520_000 },
    { id: "4", security: "ANZ Bank NZ (ANZ.NZ)", assetClass: "Equity", targetPct: 8.0, actualPct: 8.6, driftPct: 0.6, marketValue: 96_320_000 },
    { id: "5", security: "Mercury NZ (MCY.NZ)", assetClass: "Equity", targetPct: 6.0, actualPct: 5.4, driftPct: -0.6, marketValue: 60_480_000 },
    { id: "6", security: "Infratil (IFT.NZ)", assetClass: "Equity", targetPct: 7.0, actualPct: 7.8, driftPct: 0.8, marketValue: 87_360_000 },
    { id: "7", security: "Cash & Equivalents", assetClass: "Cash", targetPct: 8.0, actualPct: 3.7, driftPct: -4.3, marketValue: 41_440_000 },
  ],
  abf: [
    { id: "1", security: "Fisher & Paykel Healthcare (FPH.NZ)", assetClass: "Equity", targetPct: 8.0, actualPct: 8.6, driftPct: 0.6, marketValue: 37_651_000 },
    { id: "2", security: "Auckland Airport (AIA.NZ)", assetClass: "Equity", targetPct: 6.0, actualPct: 5.8, driftPct: -0.2, marketValue: 25_392_000 },
    { id: "3", security: "NZ Govt Bond 2028", assetClass: "Fixed Income", targetPct: 18.0, actualPct: 19.2, driftPct: 1.2, marketValue: 84_058_000 },
    { id: "4", security: "NZ Govt Bond 2031", assetClass: "Fixed Income", targetPct: 12.0, actualPct: 11.4, driftPct: -0.6, marketValue: 49_909_000 },
    { id: "5", security: "Spark New Zealand (SPK.NZ)", assetClass: "Equity", targetPct: 5.0, actualPct: 4.8, driftPct: -0.2, marketValue: 21_014_000 },
    { id: "6", security: "Cash & Equivalents", assetClass: "Cash", targetPct: 8.0, actualPct: 3.6, driftPct: -4.4, marketValue: 15_761_000 },
  ],
};

// ─── Orders ──────────────────────────────────────────────────────────────────

export type OrderStatus = "draft" | "pending" | "sent" | "partial" | "filled" | "cancelled";
export type OrderSide = "buy" | "sell";

export interface Order {
  id: string;
  date: string;
  fundId: string;
  security: string;
  side: OrderSide;
  quantity: number;
  limitPrice: number | null;
  status: OrderStatus;
  broker: string;
  filledQty: number;
  notes?: string;
}

export const MOCK_ORDERS: Order[] = [
  { id: "ORD-001", date: "2026-04-01", fundId: "agf", security: "FPH.NZ", side: "sell", quantity: 50_000, limitPrice: 35.20, status: "sent", broker: "Forsyth Barr", filledQty: 0 },
  { id: "ORD-002", date: "2026-04-01", fundId: "agf", security: "ANZ.NZ", side: "buy", quantity: 120_000, limitPrice: 28.45, status: "partial", broker: "Craigs Investment Partners", filledQty: 45_000, notes: "Partial fill at open" },
  { id: "ORD-003", date: "2026-04-01", fundId: "aif", security: "MCY.NZ", side: "buy", quantity: 200_000, limitPrice: null, status: "filled", broker: "Jarden", filledQty: 200_000 },
  { id: "ORD-004", date: "2026-03-31", fundId: "agf", security: "MEL.NZ", side: "buy", quantity: 80_000, limitPrice: 5.62, status: "pending", broker: "Forsyth Barr", filledQty: 0 },
  { id: "ORD-005", date: "2026-03-31", fundId: "abf", security: "IFT.NZ", side: "sell", quantity: 35_000, limitPrice: 11.80, status: "filled", broker: "Craigs Investment Partners", filledQty: 35_000 },
  { id: "ORD-006", date: "2026-03-31", fundId: "aif", security: "SPK.NZ", side: "buy", quantity: 300_000, limitPrice: 3.42, status: "cancelled", broker: "Jarden", filledQty: 0, notes: "Cancelled — price target not reached" },
  { id: "ORD-007", date: "2026-03-28", fundId: "abf", security: "AIA.NZ", side: "sell", quantity: 15_000, limitPrice: 8.24, status: "filled", broker: "Forsyth Barr", filledQty: 15_000 },
  { id: "ORD-008", date: "2026-04-01", fundId: "agf", security: "MFT.NZ", side: "buy", quantity: 6_000, limitPrice: 95.00, status: "draft", broker: "Forsyth Barr", filledQty: 0 },
];

// ─── Pending Settlements ─────────────────────────────────────────────────────

export interface Settlement {
  id: string;
  tradeId: string;
  fundId: string;
  security: string;
  tradeDate: string;
  settlementDate: string;
  amount: number;
  currency: string;
  status: "pending" | "settled" | "failed" | "overdue";
  counterparty: string;
}

export const MOCK_SETTLEMENTS: Settlement[] = [
  { id: "SET-001", tradeId: "ORD-003", fundId: "aif", security: "MCY.NZ", tradeDate: "2026-04-01", settlementDate: "2026-04-03", amount: 4_280_000, currency: "NZD", status: "pending", counterparty: "Jarden" },
  { id: "SET-002", tradeId: "ORD-005", fundId: "abf", security: "IFT.NZ", tradeDate: "2026-03-31", settlementDate: "2026-04-02", amount: 413_000, currency: "NZD", status: "pending", counterparty: "Craigs Investment Partners" },
  { id: "SET-003", tradeId: "ORD-007", fundId: "abf", security: "AIA.NZ", tradeDate: "2026-03-28", settlementDate: "2026-04-01", amount: 123_600, currency: "NZD", status: "overdue", counterparty: "Forsyth Barr" },
  { id: "SET-004", tradeId: "ORD-001", fundId: "agf", security: "FPH.NZ", tradeDate: "2026-03-27", settlementDate: "2026-03-31", amount: 1_248_000, currency: "NZD", status: "settled", counterparty: "Forsyth Barr" },
  { id: "SET-005", tradeId: "TRD-088", fundId: "agf", security: "ANZ.NZ", tradeDate: "2026-03-25", settlementDate: "2026-03-27", amount: 2_340_000, currency: "NZD", status: "settled", counterparty: "Craigs Investment Partners" },
  { id: "SET-006", tradeId: "TRD-091", fundId: "aif", security: "NZ Govt Bond 2031", tradeDate: "2026-03-29", settlementDate: "2026-04-01", amount: 8_720_000, currency: "NZD", status: "failed", counterparty: "NZDMO" },
];

// ─── Cash Movements ──────────────────────────────────────────────────────────

export type CashMovementType = "investment" | "redemption" | "dividend" | "interest" | "fee" | "settlement";

export interface CashMovement {
  id: string;
  date: string;
  fundId: string;
  type: CashMovementType;
  amount: number;
  currency: string;
  counterparty: string;
  status: "pending" | "processed" | "failed";
  notes?: string;
}

export const MOCK_CASH_MOVEMENTS: CashMovement[] = [
  { id: "CM-001", date: "2026-04-01", fundId: "agf", type: "investment", amount: 2_500_000, currency: "NZD", counterparty: "Wellington Super Fund", status: "processed" },
  { id: "CM-002", date: "2026-04-01", fundId: "aif", type: "redemption", amount: -1_800_000, currency: "NZD", counterparty: "NZ Retirement Trust", status: "pending" },
  { id: "CM-003", date: "2026-04-01", fundId: "aif", type: "investment", amount: 8_000_000, currency: "NZD", counterparty: "ACC", status: "processed" },
  { id: "CM-004", date: "2026-03-31", fundId: "abf", type: "dividend", amount: 125_400, currency: "NZD", counterparty: "FPH.NZ", status: "processed" },
  { id: "CM-005", date: "2026-03-31", fundId: "agf", type: "interest", amount: 48_200, currency: "NZD", counterparty: "ANZ Bank NZ", status: "processed" },
  { id: "CM-006", date: "2026-03-31", fundId: "aif", type: "fee", amount: -420_000, currency: "NZD", counterparty: "Altura Capital (Mgmt Fee)", status: "processed" },
  { id: "CM-007", date: "2026-03-28", fundId: "agf", type: "redemption", amount: -5_200_000, currency: "NZD", counterparty: "Kiwisaver Provider A", status: "processed" },
  { id: "CM-008", date: "2026-03-28", fundId: "abf", type: "settlement", amount: -413_000, currency: "NZD", counterparty: "Craigs Investment Partners", status: "pending" },
];

// ─── Data Imports ─────────────────────────────────────────────────────────────

export type ImportStatus = "success" | "failed" | "processing" | "partial";

export interface ImportBatch {
  id: string;
  date: string;
  source: string;
  fileName: string;
  status: ImportStatus;
  rowsTotal: number;
  rowsProcessed: number;
  errors: number;
  errorLog?: string[];
}

export const MOCK_IMPORT_BATCHES: ImportBatch[] = [
  { id: "IMP-012", date: "2026-04-01 08:15", source: "NZX Market Data", fileName: "nzx_prices_20260401.csv", status: "success", rowsTotal: 184, rowsProcessed: 184, errors: 0 },
  { id: "IMP-011", date: "2026-03-31 08:12", source: "NZX Market Data", fileName: "nzx_prices_20260331.csv", status: "success", rowsTotal: 184, rowsProcessed: 184, errors: 0 },
  { id: "IMP-010", date: "2026-03-31 07:45", source: "Custodian — BNP Paribas", fileName: "bnp_holdings_20260331.csv", status: "partial", rowsTotal: 342, rowsProcessed: 338, errors: 4, errorLog: ["Row 87: Unknown security ISIN NZ12345678", "Row 122: FX rate missing for USD/NZD", "Row 201: Negative quantity not allowed", "Row 289: Fund code 'ABFX' not recognised"] },
  { id: "IMP-009", date: "2026-03-28 08:30", source: "NZX Market Data", fileName: "nzx_prices_20260328.csv", status: "success", rowsTotal: 184, rowsProcessed: 184, errors: 0 },
  { id: "IMP-008", date: "2026-03-27 16:00", source: "Bloomberg", fileName: "bloomberg_rates_20260327.csv", status: "failed", rowsTotal: 52, rowsProcessed: 0, errors: 52, errorLog: ["Authentication error: Bloomberg API key expired", "All 52 rows skipped due to connection failure"] },
  { id: "IMP-007", date: "2026-03-27 08:20", source: "Custodian — BNP Paribas", fileName: "bnp_holdings_20260327.csv", status: "success", rowsTotal: 338, rowsProcessed: 338, errors: 0 },
];

// ─── Daily Tasks ─────────────────────────────────────────────────────────────

export interface DailyTask {
  id: string;
  label: string;
  done: boolean;
  priority: "high" | "medium" | "low";
  dueTime?: string;
}

export const MOCK_DAILY_TASKS: DailyTask[] = [
  { id: "t1", label: "Review overnight price imports", done: true, priority: "high", dueTime: "08:30" },
  { id: "t2", label: "Reconcile T+2 settlements due today", done: false, priority: "high", dueTime: "10:00" },
  { id: "t3", label: "Process pending redemptions (2)", done: false, priority: "high", dueTime: "11:00" },
  { id: "t4", label: "Upload NAV to Disclose Register", done: false, priority: "medium", dueTime: "12:00" },
  { id: "t5", label: "Review overdue SET-003 with Forsyth Barr", done: false, priority: "high" },
  { id: "t6", label: "Check Bloomberg API key renewal", done: false, priority: "medium" },
  { id: "t7", label: "Month-end fee accruals", done: true, priority: "medium" },
  { id: "t8", label: "Investor reporting — AGF Q1 factsheet draft", done: false, priority: "low" },
];

// ─── Compliance Rules ─────────────────────────────────────────────────────────

export type ComplianceRuleType = "concentration" | "asset_class" | "liquidity" | "custom";
export type ComplianceStatus = "pass" | "warning" | "breach";

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  type: ComplianceRuleType;
  fundId: string | "all";
  severity: "high" | "medium" | "low";
  status: ComplianceStatus;
  lastChecked: string;
  threshold: string;
  currentValue: string;
}

export const MOCK_COMPLIANCE_RULES: ComplianceRule[] = [
  { id: "CR-001", name: "Single Issuer Concentration", description: "No single equity issuer to exceed 15% of fund NAV", type: "concentration", fundId: "agf", severity: "high", status: "warning", lastChecked: "2026-04-01 09:00", threshold: "15%", currentValue: "13.4%" },
  { id: "CR-002", name: "Fixed Income Minimum", description: "Minimum 25% of NAV in investment-grade fixed income", type: "asset_class", fundId: "aif", severity: "high", status: "pass", lastChecked: "2026-04-01 09:00", threshold: "25%", currentValue: "46.8%" },
  { id: "CR-003", name: "Cash Minimum Buffer", description: "Minimum 5% cash balance at all times", type: "liquidity", fundId: "all", severity: "high", status: "breach", lastChecked: "2026-04-01 09:00", threshold: "5%", currentValue: "3.4% (AGF), 3.7% (AIF)" },
  { id: "CR-004", name: "Derivatives Limit", description: "Derivatives exposure not to exceed 5% of NAV", type: "concentration", fundId: "agf", severity: "medium", status: "pass", lastChecked: "2026-04-01 09:00", threshold: "5%", currentValue: "1.8%" },
  { id: "CR-005", name: "Unlisted Securities Limit", description: "Maximum 10% in unlisted or illiquid securities", type: "liquidity", fundId: "all", severity: "high", status: "pass", lastChecked: "2026-04-01 09:00", threshold: "10%", currentValue: "0%" },
  { id: "CR-006", name: "Related Party Transactions", description: "All related-party transactions require compliance pre-approval", type: "custom", fundId: "all", severity: "high", status: "pass", lastChecked: "2026-04-01 09:00", threshold: "Pre-approved", currentValue: "Compliant" },
  { id: "CR-007", name: "FX Hedging Ratio", description: "Non-NZD exposure to be minimum 80% hedged", type: "custom", fundId: "aif", severity: "medium", status: "warning", lastChecked: "2026-04-01 09:00", threshold: "80%", currentValue: "74%" },
  { id: "CR-008", name: "Single Broker Concentration", description: "No single broker to receive more than 40% of commission", type: "custom", fundId: "all", severity: "low", status: "pass", lastChecked: "2026-04-01 09:00", threshold: "40%", currentValue: "32%" },
];

// ─── Compliance Check History ─────────────────────────────────────────────────

export interface ComplianceCheck {
  id: string;
  ruleId: string;
  date: string;
  status: ComplianceStatus;
  triggeredBy: string;
  notes?: string;
}

export const MOCK_COMPLIANCE_CHECKS: ComplianceCheck[] = [
  { id: "CC-024", ruleId: "CR-003", date: "2026-04-01 09:00", status: "breach", triggeredBy: "Automated daily check", notes: "AGF cash fell to 3.4% following large redemption" },
  { id: "CC-023", ruleId: "CR-001", date: "2026-04-01 09:00", status: "warning", triggeredBy: "Automated daily check", notes: "FPH.NZ at 13.4%, approaching 15% limit" },
  { id: "CC-022", ruleId: "CR-007", date: "2026-04-01 09:00", status: "warning", triggeredBy: "Automated daily check" },
  { id: "CC-021", ruleId: "CR-003", date: "2026-03-31 09:00", status: "pass", triggeredBy: "Automated daily check" },
  { id: "CC-020", ruleId: "CR-001", date: "2026-03-31 09:00", status: "pass", triggeredBy: "Automated daily check" },
];

// ─── Audit Log ────────────────────────────────────────────────────────────────

export type AuditAction = "create" | "update" | "delete" | "approve" | "reject" | "login" | "export" | "run_check";

export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  userRole: string;
  action: AuditAction;
  entity: string;
  entityId: string;
  details: string;
  oldValue?: string;
  newValue?: string;
}

export const MOCK_AUDIT_LOG: AuditEntry[] = [
  { id: "AL-098", timestamp: "2026-04-01 09:15", user: "Sarah Chen", userRole: "Compliance Officer", action: "run_check", entity: "compliance_rule", entityId: "CR-003", details: "Manual compliance check triggered for Cash Minimum Buffer" },
  { id: "AL-097", timestamp: "2026-04-01 09:00", user: "System", userRole: "system", action: "run_check", entity: "compliance_rule", entityId: "all", details: "Automated daily compliance check run" },
  { id: "AL-096", timestamp: "2026-04-01 08:45", user: "James Tait", userRole: "Portfolio Manager", action: "create", entity: "order", entityId: "ORD-008", details: "New buy order created for MFT.NZ — 6,000 shares", newValue: '{"security":"MFT.NZ","side":"buy","qty":6000,"limit":95.00}' },
  { id: "AL-095", timestamp: "2026-04-01 08:30", user: "System", userRole: "system", action: "create", entity: "import_batch", entityId: "IMP-012", details: "NZX price import completed — 184 rows processed" },
  { id: "AL-094", timestamp: "2026-04-01 08:15", user: "Lisa Park", userRole: "Operations", action: "update", entity: "settlement", entityId: "SET-003", details: "Settlement status updated", oldValue: "pending", newValue: "overdue" },
  { id: "AL-093", timestamp: "2026-03-31 16:42", user: "James Tait", userRole: "Portfolio Manager", action: "update", entity: "order", entityId: "ORD-002", details: "Order ANZ.NZ partial fill updated", oldValue: '{"filledQty":0}', newValue: '{"filledQty":45000}' },
  { id: "AL-092", timestamp: "2026-03-31 15:10", user: "Sarah Chen", userRole: "Compliance Officer", action: "approve", entity: "order", entityId: "ORD-001", details: "Sell order FPH.NZ approved for execution" },
  { id: "AL-091", timestamp: "2026-03-31 14:30", user: "Tom Walker", userRole: "Operations", action: "create", entity: "cash_movement", entityId: "CM-006", details: "Q1 management fee processed — AIF" },
  { id: "AL-090", timestamp: "2026-03-31 12:00", user: "Lisa Park", userRole: "Operations", action: "export", entity: "settlement", entityId: "all", details: "Settlement report exported to CSV" },
  { id: "AL-089", timestamp: "2026-03-31 09:05", user: "Sarah Chen", userRole: "Compliance Officer", action: "login", entity: "session", entityId: "session-sc-442", details: "User login from 192.168.1.45" },
  { id: "AL-088", timestamp: "2026-03-28 14:22", user: "James Tait", userRole: "Portfolio Manager", action: "delete", entity: "order", entityId: "ORD-006", details: "Cancelled order removed from active blotter" },
  { id: "AL-087", timestamp: "2026-03-28 11:15", user: "Tom Walker", userRole: "Operations", action: "create", entity: "cash_movement", entityId: "CM-007", details: "Redemption processed for Kiwisaver Provider A — AGF $5.2M" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatNZD(amount: number, compact = false): string {
  if (compact) {
    if (Math.abs(amount) >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(2)}B`;
    if (Math.abs(amount) >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
    if (Math.abs(amount) >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
    return `$${amount.toFixed(0)}`;
  }
  return new Intl.NumberFormat("en-NZ", { style: "currency", currency: "NZD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-NZ", { day: "2-digit", month: "short", year: "numeric" });
}
