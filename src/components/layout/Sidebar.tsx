"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationConfig } from "@/config/navigation";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex h-full flex-col border-r"
      style={{
        width: "var(--sidebar-width)",
        backgroundColor: "var(--altura-navy-surface)",
        borderColor: "var(--altura-border)",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div className="flex h-[var(--topnav-height)] items-center gap-3 px-5 border-b" style={{ borderColor: "var(--altura-border)" }}>
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #C5A572 0%, #B08A52 100%)" }}
        >
          <span className="text-sm font-bold" style={{ color: "var(--altura-navy)" }}>A</span>
        </div>
        <div>
          <div className="text-sm font-semibold leading-none" style={{ color: "var(--altura-text-primary)" }}>
            Altura
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--altura-text-muted)" }}>
            Fund Management
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navigationConfig.map((group) => (
          <div key={group.label} className="mb-4">
            {group.label && (
              <div className="px-2 mb-1">
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--altura-text-muted)" }}>
                  {group.label}
                </span>
              </div>
            )}
            {group.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href + "/")) ||
                (item.href !== "/dashboard" && pathname === item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors group"
                  style={{
                    color: isActive ? "var(--altura-gold)" : "var(--altura-text-secondary)",
                    backgroundColor: isActive ? "rgba(197,165,114,0.08)" : "transparent",
                  }}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className="ml-auto text-xs rounded-full px-1.5 py-0.5 font-medium"
                      style={{ backgroundColor: "rgba(197,165,114,0.15)", color: "var(--altura-gold)" }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t p-3" style={{ borderColor: "var(--altura-border)" }}>
        <div className="flex items-center gap-3 rounded-md px-3 py-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
            style={{ backgroundColor: "var(--altura-gold)", color: "var(--altura-navy)" }}
          >
            PM
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate" style={{ color: "var(--altura-text-primary)" }}>Portfolio Manager</div>
            <div className="text-xs truncate" style={{ color: "var(--altura-text-muted)" }}>pm@altura.com</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
