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
    <div className="min-h-screen w-screen flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative w-16 h-16 mb-4 rounded-2xl overflow-hidden border-2 border-zinc-200 dark:border-zinc-800 shadow-md">
            <img
              src="/icon.jpeg"
              alt="Project Access"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Project Access
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 max-w-xs">
            Indian Criminal Law statutory assistant and legal vector index RAG platform.
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md rounded-2xl border border-zinc-200 dark:border-zinc-800/80 p-6 sm:p-8 shadow-xl relative overflow-hidden transition-all">
          {/* Subtle top decoration gradient */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-zinc-500 via-zinc-400 to-zinc-900 dark:from-zinc-800 dark:via-zinc-600 dark:to-zinc-950" />

          {/* Feedback states */}
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {localMode === "unverified" ? (
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-3 rounded-full bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-semibold">Verify Your Email Address</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">
                We've sent a 6-digit verification code to <span className="font-medium text-zinc-800 dark:text-zinc-200">{email}</span>. 
                Please enter the code below to activate your account.
              </p>

              {/* OTP Input Form */}
              <form onSubmit={handleVerifyOtp} className="w-full space-y-4">
                <div className="space-y-1.5 text-left">
                  <label htmlFor="otp" className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
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
                    className="w-full text-center py-2.5 text-xl tracking-[10px] font-bold rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent focus:outline-none focus:border-zinc-500 dark:focus:border-zinc-600 transition-colors"
                  />
                </div>

                {/* Dev warning note */}
                <div className="w-full p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-[10px] text-zinc-400 text-left font-mono">
                  <span className="font-semibold text-amber-500 uppercase">Dev Environment:</span> Check terminal logs for verification code.
                </div>

                <div className="w-full pt-2 space-y-3">
                  <button
                    type="submit"
                    disabled={isLoading || otp.length !== 6}
                    className="w-full py-2.5 px-4 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-medium text-xs shadow hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors cursor-pointer"
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
                    className="w-full py-2 px-4 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
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
                    className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
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
                  <label htmlFor="name" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="name"
                      type="text"
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent focus:outline-none focus:border-zinc-500 dark:focus:border-zinc-600 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent focus:outline-none focus:border-zinc-500 dark:focus:border-zinc-600 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent focus:outline-none focus:border-zinc-500 dark:focus:border-zinc-600 transition-colors"
                  />
                </div>
              </div>

              {localMode === "signup" && (
                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent focus:outline-none focus:border-zinc-500 dark:focus:border-zinc-600 transition-colors"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 mt-6 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-medium text-xs shadow hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all cursor-pointer"
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

              <div className="text-center pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
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
                  className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
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
