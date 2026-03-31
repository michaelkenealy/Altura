"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormData) {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setError("root", {
        message:
          error.message === "Invalid login credentials"
            ? "Invalid email or password. Please check your credentials and try again."
            : error.message,
      });
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* Root error */}
      {errors.root && (
        <div
          className="flex items-start gap-3 rounded-md p-3 text-sm"
          style={{
            backgroundColor: "rgba(239,68,68,0.08)",
            color: "#EF4444",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{errors.root.message}</span>
        </div>
      )}

      {/* Email */}
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
            e.currentTarget.style.boxShadow = errors.email
              ? "0 0 0 2px rgba(239,68,68,0.15)"
              : "0 0 0 2px rgba(197,165,114,0.15)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = errors.email
              ? "#EF4444"
              : "var(--altura-border)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        {errors.email && (
          <p className="text-xs flex items-center gap-1" style={{ color: "#EF4444" }}>
            <AlertCircle size={11} />
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="block text-sm font-medium"
            style={{ color: "var(--altura-text-secondary)" }}
          >
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-xs transition-colors hover:opacity-80"
            style={{ color: "var(--altura-gold)" }}
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            {...register("password")}
            className="w-full rounded-md px-3 py-2.5 pr-10 text-sm outline-none transition-all"
            style={{
              backgroundColor: "var(--altura-navy-elevated)",
              border: `1px solid ${errors.password ? "#EF4444" : "var(--altura-border)"}`,
              color: "var(--altura-text-primary)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = errors.password
                ? "#EF4444"
                : "var(--altura-gold)";
              e.currentTarget.style.boxShadow = errors.password
                ? "0 0 0 2px rgba(239,68,68,0.15)"
                : "0 0 0 2px rgba(197,165,114,0.15)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = errors.password
                ? "#EF4444"
                : "var(--altura-border)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-80"
            style={{ color: "var(--altura-text-muted)" }}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs flex items-center gap-1" style={{ color: "#EF4444" }}>
            <AlertCircle size={11} />
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 w-full rounded-md py-2.5 text-sm font-semibold transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
        style={{
          background: "linear-gradient(135deg, #C5A572 0%, #B08A52 100%)",
          color: "var(--altura-navy)",
        }}
      >
        {isSubmitting ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </button>
    </form>
  );
}
