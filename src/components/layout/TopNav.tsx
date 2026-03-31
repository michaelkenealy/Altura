"use client";

import { Bell, Search } from "lucide-react";
import { BreadcrumbNav } from "./BreadcrumbNav";

export function TopNav() {
  return (
    <header
      className="flex h-[var(--topnav-height)] items-center gap-4 border-b px-6"
      style={{
        backgroundColor: "var(--altura-navy-surface)",
        borderColor: "var(--altura-border)",
        flexShrink: 0,
      }}
    >
      <div className="flex-1">
        <BreadcrumbNav />
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <button
          className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors hover:opacity-80"
          style={{
            backgroundColor: "var(--altura-navy-elevated)",
            border: "1px solid var(--altura-border)",
            color: "var(--altura-text-muted)",
          }}
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden sm:inline text-xs rounded px-1" style={{ backgroundColor: "var(--altura-border)", color: "var(--altura-text-muted)" }}>
            ⌘K
          </kbd>
        </button>

        {/* Notifications */}
        <button
          className="relative rounded-md p-2 transition-colors hover:opacity-80"
          style={{ color: "var(--altura-text-secondary)" }}
        >
          <Bell className="h-4 w-4" />
          <span
            className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: "var(--altura-gold)" }}
          />
        </button>
      </div>
    </header>
  );
}
