export const APP_NAME = "Altura";
export const APP_DESCRIPTION = "Professional Investment Fund Portfolio Management Platform";

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  FUNDS: "/dashboard/funds",
  PORTFOLIO: "/dashboard/portfolio",
  ORDERS: "/dashboard/orders",
  COMPLIANCE: "/dashboard/compliance",
  OPERATIONS: "/dashboard/operations",
  SETTINGS: "/dashboard/settings",
  USERS: "/dashboard/settings/users",
  ROLES: "/dashboard/settings/roles",
} as const;

export const FUND_STRATEGIES = [
  "Long/Short Equity",
  "Global Macro",
  "Event Driven",
  "Relative Value",
  "Credit",
  "Multi-Strategy",
  "Quantitative",
] as const;

export const ORDER_STATUSES = [
  "pending",
  "submitted",
  "partial",
  "filled",
  "cancelled",
  "rejected",
] as const;

export const ASSET_CLASSES = [
  "Equity",
  "Fixed Income",
  "Derivatives",
  "FX",
  "Commodities",
  "Real Assets",
  "Private Equity",
  "Hedge Funds",
] as const;
