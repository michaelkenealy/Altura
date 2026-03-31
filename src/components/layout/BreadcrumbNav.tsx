"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  funds: "Funds",
  portfolio: "Portfolio",
  orders: "Orders",
  compliance: "Compliance",
  operations: "Operations",
  settings: "Settings",
  users: "Users",
  roles: "Roles",
};

export function BreadcrumbNav() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav className="flex items-center gap-1 text-sm">
      {segments.map((segment, index) => {
        const href = "/" + segments.slice(0, index + 1).join("/");
        const label = routeLabels[segment] ?? segment;
        const isLast = index === segments.length - 1;

        return (
          <div key={href} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5" style={{ color: "var(--altura-text-muted)" }} />
            )}
            {isLast ? (
              <span className="font-medium" style={{ color: "var(--altura-text-primary)" }}>
                {label}
              </span>
            ) : (
              <Link href={href} className="hover:underline" style={{ color: "var(--altura-text-secondary)" }}>
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
