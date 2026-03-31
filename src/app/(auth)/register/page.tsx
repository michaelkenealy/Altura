export const metadata = { title: "Register" };

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--altura-navy)" }}>
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #C5A572 0%, #B08A52 100%)" }}>
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-2xl font-semibold tracking-tight" style={{ color: "var(--altura-text-primary)" }}>Altura</span>
          </div>
        </div>
        <div className="altura-card p-8">
          <h1 className="text-xl font-semibold mb-4" style={{ color: "var(--altura-text-primary)" }}>Create your account</h1>
          <p style={{ color: "var(--altura-text-secondary)" }} className="text-sm">Contact your administrator to receive an invitation.</p>
        </div>
      </div>
    </main>
  );
}
