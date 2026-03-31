"use client";

import { useState } from "react";
import Link from "next/link";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    // TODO: Implement Supabase auth
    setTimeout(() => setIsLoading(false), 1000);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md p-3 text-sm" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}>
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="block text-sm font-medium" style={{ color: "var(--altura-text-secondary)" }}>
          Email address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@firm.com"
          className="w-full rounded-md px-3 py-2 text-sm outline-none transition-colors focus:ring-1"
          style={{
            backgroundColor: "var(--altura-navy-elevated)",
            border: "1px solid var(--altura-border)",
            color: "var(--altura-text-primary)",
          }}
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium" style={{ color: "var(--altura-text-secondary)" }}>
            Password
          </label>
          <Link href="/forgot-password" className="text-xs hover:underline" style={{ color: "var(--altura-gold)" }}>
            Forgot password?
          </Link>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="••••••••"
          className="w-full rounded-md px-3 py-2 text-sm outline-none transition-colors"
          style={{
            backgroundColor: "var(--altura-navy-elevated)",
            border: "1px solid var(--altura-border)",
            color: "var(--altura-text-primary)",
          }}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-md py-2.5 text-sm font-semibold transition-opacity disabled:opacity-60"
        style={{
          background: "linear-gradient(135deg, #C5A572 0%, #B08A52 100%)",
          color: "var(--altura-navy)",
        }}
      >
        {isLoading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
