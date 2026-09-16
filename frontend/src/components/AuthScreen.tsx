"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, User as UserIcon, ArrowRight, ShieldAlert, CheckCircle2, RotateCcw, AlertTriangle } from "lucide-react";

interface AuthScreenProps {
  mode: "signin" | "signup";
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ mode }) => {
  const router = useRouter();
  const [localMode, setLocalMode] = useState<"signin" | "signup" | "unverified">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // For unverified screen state
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    setLocalMode(mode);
  }, [mode]);

  useEffect(() => {
    // Check if user is already logged in
    const checkLoggedIn = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            router.push("/");
          }
        }
      } catch (e) {
        // Not logged in, proceed
      }
    };
    checkLoggedIn();
  }, [router]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate fields
    if (localMode === "signup") {
      if (!name.trim()) {
        setError("Name is required");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
    }

    setIsLoading(true);

    try {
      if (localMode === "signin") {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          if (data.unverified) {
            setLocalMode("unverified");
            setIsLoading(false);
            return;
          }
          throw new Error(data.error || "Failed to log in");
        }

        if (data.success) {
          router.push("/");
        }
      } else {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to sign up");
        }

        if (data.success) {
          setSuccess(data.message);
          setLocalMode("unverified");
          // If token logged to console in dev mode, alert developer
          if (data.loggedToConsole) {
            console.log("%c[Project Access Dev Note] Check server console for verification code!", "color: orange; font-weight: bold; font-size: 14px;");
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (otp.length !== 6) {
      setError("Please enter a 6-digit verification code");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to verify code");
      }

      setSuccess(data.message || "Email verified successfully!");
      // Automatically redirect to homepage after success
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Invalid or expired verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, resend: true }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to resend verification code");
      }

      setSuccess("A new verification code has been sent.");
      setResendCooldown(60); // 60s cooldown
    } catch (err: any) {
      setError(err.message || "Failed to resend verification code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center p-4 bg-[#0f1419] text-[var(--color-text-primary)] transition-colors relative overflow-hidden">
      {/* Ambient Glow Layers */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Top center teal-emerald aura */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[480px] bg-emerald-600/15 rounded-full blur-[140px]" />
        {/* Bottom-left muted green glow */}
        <div className="absolute -bottom-24 -left-20 w-[550px] h-[550px] bg-teal-700/15 rounded-full blur-[160px]" />
        {/* Right side indigo/slate ambient tone */}
        <div className="absolute top-1/3 -right-24 w-[480px] h-[480px] bg-sky-800/15 rounded-full blur-[150px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Brand */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative w-16 h-16 mb-4 rounded-2xl overflow-hidden border-2 border-emerald-500/30 shadow-[0_0_24px_rgba(52,211,153,0.2)]">
            <img
              src="/icon.jpeg"
              alt="Project Access"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Project Access
          </h1>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-1.5 max-w-xs">
            Indian Criminal Law statutory assistant and legal vector index RAG platform.
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-[var(--color-border-primary)] p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden transition-all">
          {/* Subtle top decoration gradient */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/50 via-teal-500/50 to-emerald-500/50" />

          {/* Feedback states */}
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {localMode === "unverified" ? (
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-3 rounded-full bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-semibold">Verify Your Email Address</h2>
              <p className="text-xs text-[var(--color-text-tertiary)] max-w-xs leading-relaxed">
                We've sent a 6-digit verification code to <span className="font-medium text-[var(--color-text-primary)]">{email}</span>.
                Please enter the code below to activate your account.
              </p>

              {/* OTP Input Form */}
              <form onSubmit={handleVerifyOtp} className="w-full space-y-4">
                <div className="space-y-1.5 text-left">
                  <label htmlFor="otp" className="text-[var(--text-xs)] font-semibold uppercase tracking-wider text-[var(--color-text-quaternary)]">
                    Verification Code (OTP)
                  </label>
                  <input
                    id="otp"
                    type="text"
                    maxLength={6}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="w-full text-center py-2.5 text-xl tracking-[10px] font-bold rounded-lg border border-[var(--color-border-primary)] bg-transparent focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                  />
                </div>

                {/* Dev warning note */}
                <div className="w-full p-2.5 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)] text-[var(--text-xs)] text-[var(--color-text-quaternary)] text-left font-mono">
                  <span className="font-semibold text-[var(--color-warning)] uppercase">Dev Environment:</span> Check terminal logs for verification code.
                </div>

                <div className="w-full pt-2 space-y-3">
                  <button
                    type="submit"
                    disabled={isLoading || otp.length !== 6}
                    className="w-full py-2.5 px-4 rounded-lg bg-emerald-500 text-slate-950 font-medium text-xs shadow-[0_4px_14px_rgba(52,211,153,0.3)] hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>Verify Code</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={isLoading || resendCooldown > 0}
                    className="w-full py-2 px-4 rounded-lg border border-[var(--color-border-primary)] hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] font-medium text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Verification Code"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setSuccess(null);
                      router.push("/login");
                    }}
                    className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-lg font-semibold mb-2">
                {localMode === "signin" ? "Welcome back" : "Create an account"}
              </h2>

              {localMode === "signup" && (
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-xs font-medium text-[var(--color-text-tertiary)]">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-[var(--color-text-quaternary)] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="name"
                      type="text"
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-[var(--color-border-primary)] bg-transparent focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-medium text-[var(--color-text-tertiary)]">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[var(--color-text-quaternary)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-[var(--color-border-primary)] bg-transparent focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-medium text-[var(--color-text-tertiary)]">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[var(--color-text-quaternary)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-[var(--color-border-primary)] bg-transparent focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                  />
                </div>
              </div>

              {localMode === "signup" && (
                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="text-xs font-medium text-[var(--color-text-tertiary)]">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[var(--color-text-quaternary)] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-[var(--color-border-primary)] bg-transparent focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 mt-6 rounded-lg bg-emerald-500 text-slate-950 font-medium text-xs shadow-[0_4px_14px_rgba(52,211,153,0.3)] hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{localMode === "signin" ? "Sign In" : "Sign Up"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <div className="text-center pt-4 border-t border-[var(--color-border-primary)]/80">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccess(null);
                    if (localMode === "signin") {
                      router.push("/register");
                    } else {
                      router.push("/login");
                    }
                  }}
                  className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  {localMode === "signin" ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
