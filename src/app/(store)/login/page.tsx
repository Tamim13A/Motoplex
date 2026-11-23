"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { useToast } from "@/context/ToastContext";

function CustomerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect") || "";
  const safeRedirectPath =
    redirectParam && !redirectParam.startsWith("/admin") ? redirectParam : "/account";

  const { showToast } = useToast();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // If already logged in, automatically redirect to appropriate dashboard
  useEffect(() => {
    if (searchParams.get("logged_out") === "true") {
      setIsCheckingAuth(false);
      return;
    }

    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.success && json.data?.user) {
          const role = json.data.user.role;
          if (role === "admin" || role === "moderator") {
            window.location.href = redirectParam.startsWith("/admin") ? redirectParam : "/admin";
          } else {
            window.location.href = safeRedirectPath;
          }
        } else {
          setIsCheckingAuth(false);
        }
      })
      .catch(() => {
        setIsCheckingAuth(false);
      });
  }, [redirectParam, safeRedirectPath, searchParams]);

  const handleFillDemoCustomer = () => {
    setIdentifier("customer@motoplex.bd");
    setPassword("motoplex2026");
    showToast("Demo Rider Credentials Filled", "customer@motoplex.bd loaded.", "info");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      showToast("Missing Information", "Please enter your email/phone and password.", "error");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const user = data.data?.user;
        const role = user?.role;

        // Dispatch global auth change event so Header immediately reflects the logged-in user
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("auth-state-change"));
        }

        // ROLE-BASED REDIRECTION:
        // Admin and Moderator are staff -> redirect directly to /admin
        if (role === "admin" || role === "moderator") {
          showToast(
            "Staff Access Verified",
            `Redirecting to Admin Operations Console as ${user?.name || "Staff"}.`,
            "success"
          );
          window.location.href = redirectParam.startsWith("/admin") ? redirectParam : "/admin";
          return;
        }

        // Regular customer -> redirect to customer account
        showToast(
          "Welcome Back!",
          `Signed in successfully as ${user?.name || "Rider"}.`,
          "success"
        );
        window.location.href = safeRedirectPath;
      } else {
        showToast(
          "Sign In Failed",
          data.message || "Invalid email/phone or password. Please try again.",
          "error"
        );
      }
    } catch {
      showToast("Network Error", "Unable to reach server. Please check your connection.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="bg-zinc-50 min-h-[85vh] flex items-center justify-center text-xs font-semibold text-zinc-500">
        Verifying existing session...
      </div>
    );
  }

  return (
    <div className="bg-zinc-50 min-h-[85vh] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl border border-zinc-200 p-7 sm:p-9 shadow-xl space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-1.5">
          <Link href="/" className="inline-block">
            <span className="font-black text-2xl tracking-tighter text-zinc-950">
              MOTOPLEX
            </span>
            <span className="text-[10px] font-bold tracking-widest text-red-600 block -mt-1 uppercase">
              BANGLADESH
            </span>
          </Link>
          <h1 className="text-xl font-black text-zinc-900 tracking-tight">
            Customer Account Sign In
          </h1>
          <p className="text-xs text-zinc-500">
            Access your orders, track shipments, workshop bookings & rider profile
          </p>
        </div>

        {/* 1-Click Demo Customer Fill */}
        <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200 flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <span className="font-bold text-zinc-800 block text-xs">Rider Demo Account</span>
            <span className="text-[11px] text-zinc-500 font-mono">customer@motoplex.bd</span>
          </div>
          <button
            type="button"
            onClick={handleFillDemoCustomer}
            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold px-3 py-1.5 rounded-xl transition-colors text-xs cursor-pointer"
          >
            Auto Fill
          </button>
        </div>

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-zinc-900 block mb-1.5 text-xs">
              Email or Mobile Number (+880)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="017XXXXXXXX or email@example.com"
                className="w-full bg-zinc-50 border border-zinc-300 rounded-xl pl-10 pr-3.5 py-2.5 text-zinc-900 text-sm focus:outline-none focus:border-red-600 focus:bg-white font-medium transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-zinc-900 text-xs">Account Password</label>
              <Link
                href="/forgot-password"
                className="text-xs text-red-600 hover:underline font-semibold"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-50 border border-zinc-300 rounded-xl pl-10 pr-3.5 py-2.5 text-zinc-900 text-sm focus:outline-none focus:border-red-600 focus:bg-white font-medium transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-sm py-3 rounded-xl transition-all shadow-md shadow-red-600/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <span>Signing In...</span>
            ) : (
              <span className="flex items-center gap-1.5">
                <span>Sign In to Rider Account</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        {/* Footer Registration Link */}
        <div className="text-center text-xs text-zinc-600 pt-3 border-t border-zinc-100 space-y-2">
          <div>
            Don&apos;t have a Motoplex account yet?{" "}
            <Link href="/register" className="font-bold text-red-600 hover:underline">
              Create Customer Account
            </Link>
          </div>
          <div className="flex items-center justify-center gap-2 text-zinc-500 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Official Aprilia, Moto Guzzi & Vespa Importer in Bangladesh</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] bg-zinc-50 flex items-center justify-center text-xs text-zinc-500">
          Loading sign in portal...
        </div>
      }
    >
      <CustomerLoginForm />
    </Suspense>
  );
}
