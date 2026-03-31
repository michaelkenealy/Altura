import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Sign In",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--altura-navy)" }}>
      <div className="w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #C5A572 0%, #B08A52 100%)" }}>
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-2xl font-semibold tracking-tight" style={{ color: "var(--altura-text-primary)" }}>
              Altura
            </span>
          </div>
          <p className="text-sm" style={{ color: "var(--altura-text-secondary)" }}>
            Professional Fund Portfolio Management
          </p>
        </div>

        {/* Card */}
        <div className="altura-card p-8">
          <div className="mb-6">
            <h1 className="text-xl font-semibold mb-1" style={{ color: "var(--altura-text-primary)" }}>
              Sign in to your account
            </h1>
            <p className="text-sm" style={{ color: "var(--altura-text-secondary)" }}>
              Enter your credentials to access the platform
            </p>
          </div>
          <LoginForm />
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "var(--altura-text-muted)" }}>
          © {new Date().getFullYear()} Altura Capital Management. All rights reserved.
        </p>
      </div>
    </main>
  );
}
