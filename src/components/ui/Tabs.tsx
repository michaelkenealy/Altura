"use client";

interface Tab {
  id: string;
  label: string;
  badge?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 border-b" style={{ borderColor: "var(--altura-border)" }}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors"
            style={{
              color: isActive ? "var(--altura-text-primary)" : "var(--altura-text-muted)",
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                className="rounded-full px-1.5 py-0.5 text-xs font-semibold"
                style={{ backgroundColor: "rgba(239,68,68,0.15)", color: "var(--status-negative)" }}
              >
                {tab.badge}
              </span>
            )}
            {isActive && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
                style={{ background: "linear-gradient(90deg, var(--altura-gold) 0%, var(--altura-gold-muted) 100%)" }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
