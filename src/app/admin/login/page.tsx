"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  AlertTriangle,
  Wrench,
  Terminal,
} from "lucide-react";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isLoggedOut = searchParams.get("logged_out") === "true";

  React.useEffect(() => {
    if (isLoggedOut) {
      // Do not auto-redirect if staff explicitly logged out
      return;
    }

    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.success && json.data?.user) {
          const role = json.data.user.role;
          if (role === "admin" || role === "moderator") {
            window.location.href = redirectPath.startsWith("/admin") ? redirectPath : "/admin";
          }
        }
      })
      .catch(() => {});
  }, [redirectPath, isLoggedOut]);

  const handleFillAdmin = () => {
    setEmail("admin@motoplex.bd");
    setPassword("motoplex2026");
    setErrorMessage("");
  };

  const handleFillModerator = () => {
    setEmail("moderator@motoplex.bd");
    setPassword("motoplex2026");
    setErrorMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please enter both administrator email and password.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("auth-state-change"));
        }
        window.location.href = redirectPath.startsWith("/admin") ? redirectPath : "/admin";
      } else {
        setErrorMessage(data.message || "Authentication failed. Invalid staff credentials.");
      }
    } catch {
      setErrorMessage("Network error connecting to security server. Please retry.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4 sm:p-6 font-sans select-none">
      <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-3xl p-7 sm:p-9 shadow-2xl backdrop-blur-xl space-y-6">
        {/* Italian Tricolor Brand Accent Line */}
        <div className="flex h-1.5 w-full rounded-full overflow-hidden shadow-xs">
          <span className="bg-emerald-500 flex-1" />
          <span className="bg-white flex-1" />
          <span className="bg-red-600 flex-1" />
        </div>

        {/* Terminal Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-800/80 text-red-400 text-[11px] font-mono font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Operations Command Terminal
          </div>

          <div className="pt-2">
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
              <span>MOTOPLEX</span>
              <span className="text-red-500 text-xs px-2 py-0.5 rounded bg-red-950 border border-red-800">
                HQ
              </span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Official Staff & Executive Administrator Authentication
            </p>
          </div>
        </div>

        {/* Quick Role Fillers (Development / Verification) */}
        <div className="p-3 bg-zinc-950/70 rounded-2xl border border-zinc-800 space-y-2 text-xs">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
            Authorized System Roles
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleFillAdmin}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 font-bold text-white text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Super Admin</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono block">Full Control</span>
            </button>

            <button
              type="button"
              onClick={handleFillModerator}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 font-bold text-white text-[11px]">
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                <span>Moderator</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono block">Limited Ops</span>
            </button>
          </div>
        </div>

        {/* Logged Out Confirmation Banner */}
        {isLoggedOut && !errorMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="space-y-0.5">
              <span className="font-bold block">Console Session Terminated Securely</span>
              <p className="text-emerald-300/80 text-[11px]">
                Tokens flushed. Enter credentials to re-authenticate.
              </p>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block">Security Gate Notice:</span>
              <p className="text-red-300/90 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-zinc-300 block mb-1.5 text-xs">
              Staff Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@motoplex.bd"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors font-medium"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-zinc-300 block mb-1.5 text-xs">
              Command Key / Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors font-medium font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-sm py-3 rounded-xl transition-all shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Verifying Cryptographic Credentials...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2 font-black">
                <span>AUTHENTICATE & ENTER CONSOLE</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        {/* Footer Security Watermark */}
        <div className="pt-3 border-t border-zinc-800/80 text-center space-y-2 text-[11px] text-zinc-500">
          <div className="flex items-center justify-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-zinc-400" />
            <span>Zero-Trust RBAC Core Active • IP Rate-Limited</span>
          </div>
          <Link
            href="/"
            className="text-zinc-400 hover:text-white underline inline-block"
          >
            ← Return to Public Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-xs text-zinc-500">
          Loading Security Gate...
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}

