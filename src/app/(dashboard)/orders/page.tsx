export const metadata = { title: "Orders" };

export default function OrdersPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--altura-text-primary)" }}>Orders</h1>
        <p className="text-sm mt-1" style={{ color: "var(--altura-text-secondary)" }}>Order management and execution tracking</p>
      </div>
      <div className="altura-card p-6 h-96 flex items-center justify-center">
        <p style={{ color: "var(--altura-text-muted)" }} className="text-sm">Order blotter — coming soon</p>
      </div>
    </div>
  );
}
