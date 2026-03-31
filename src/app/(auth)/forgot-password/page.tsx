"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      setError("root", { message: error.message });
      return;
    }

    setSentEmail(data.email);
    setSent(true);
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "var(--altura-navy)" }}
    >
      <div className="w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #C5A572 0%, #B08A52 100%)",
              }}
            >
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span
              className="text-2xl font-semibold tracking-tight"
              style={{ color: "var(--altura-text-primary)" }}
            >
              Altura
            </span>
          </div>
        </div>

        <div className="altura-card p-8">
          {sent ? (
            // ── Success state ──────────────────────────────────────────────
            <div className="text-center space-y-4">
              <div
                className="inline-flex h-14 w-14 items-center justify-center rounded-full mx-auto"
                style={{ backgroundColor: "rgba(34,197,94,0.12)" }}
              >
                <CheckCircle2 size={28} style={{ color: "#4ADE80" }} />
              </div>
              <div>
                <h1
                  className="text-xl font-semibold mb-2"
                  style={{ color: "var(--altura-text-primary)" }}
                >
                  Check your inbox
                </h1>
                <p className="text-sm leading-relaxed" style={{ color: "var(--altura-text-secondary)" }}>
                  We&apos;ve sent password reset instructions to{" "}
                  <span style={{ color: "var(--altura-gold)" }}>{sentEmail}</span>.
                  The link expires in 1 hour.
                </p>
              </div>
              <p className="text-xs pt-2" style={{ color: "var(--altura-text-muted)" }}>
                Didn&apos;t receive it? Check your spam folder or{" "}
                <button
                  onClick={() => setSent(false)}
                  className="underline hover:no-underline"
                  style={{ color: "var(--altura-gold)" }}
                >
                  try again
                </button>
                .
              </p>
            </div>
          ) : (
            // ── Form state ────────────────────────────────────────────────
            <>
              <div className="mb-6">
                <h1
                  className="text-xl font-semibold mb-1"
                  style={{ color: "var(--altura-text-primary)" }}
                >
                  Reset your password
                </h1>
                <p className="text-sm" style={{ color: "var(--altura-text-secondary)" }}>
                  Enter the email associated with your account and we&apos;ll send
                  you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                {errors.root && (
                  <div
                    className="flex items-start gap-2.5 rounded-md p-3 text-sm"
                    style={{
                      backgroundColor: "rgba(239,68,68,0.08)",
                      color: "#EF4444",
                      border: "1px solid rgba(239,68,68,0.2)",
                    }}
                  >
                    <AlertCircle size={15} className="mt-0.5 shrink-0" />
                    {errors.root.message}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium"
                    style={{ color: "var(--altura-text-secondary)" }}
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@firm.com"
                    {...register("email")}
                    className="w-full rounded-md px-3 py-2.5 text-sm outline-none transition-all"
                    style={{
                      backgroundColor: "var(--altura-navy-elevated)",
                      border: `1px solid ${errors.email ? "#EF4444" : "var(--altura-border)"}`,
                      color: "var(--altura-text-primary)",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = errors.email
                        ? "#EF4444"
                        : "var(--altura-gold)";
                      e.currentTarget.style.boxShadow = "0 0 0 2px rgba(197,165,114,0.15)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = errors.email
                        ? "#EF4444"
                        : "var(--altura-border)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                  {errors.email && (
                    <p
                      className="text-xs flex items-center gap-1"
                      style={{ color: "#EF4444" }}
                    >
                      <AlertCircle size={11} />
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-md py-2.5 text-sm font-semibold transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{
                    background: "linear-gradient(135deg, #C5A572 0%, #B08A52 100%)",
                    color: "var(--altura-navy)",
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Mail size={15} />
                      Send reset link
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="text-center mt-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm transition-opacity hover:opacity-80"
            style={{ color: "var(--altura-text-muted)" }}
          >
            <ArrowLeft size={14} />
            Back to sign in
          </Link>
        </div>

        <p
          className="text-center text-xs mt-4"
          style={{ color: "var(--altura-text-muted)" }}
        >
          © {new Date().getFullYear()} Altura Capital Management. All rights reserved.
        </p>
      </div>
    </main>
  );
}
