"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FolderTree,
  Tag,
  Users,
  Store,
  Menu,
  X,
  ShieldCheck,
  Search,
  Receipt,
  BarChart3,
  Settings,
  Wrench,
  LogOut,
  AlertCircle,
  Lock,
  Unlock,
  KeyRound,
  Delete,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isScreenLocked, setIsScreenLocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [currentUser, setCurrentUser] = useState<{
    id?: string;
    name?: string;
    email?: string;
    role?: string;
  } | null>(null);

  // Initialize and listen to Multi-Tab Broadcast Channel
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if terminal was previously locked in this browser session
    const storedLock = sessionStorage.getItem("motoplex_screen_locked") === "true";
    if (storedLock) {
      setIsScreenLocked(true);
    }

    if (!("BroadcastChannel" in window)) return;
    const channel = new BroadcastChannel("motoplex_admin_bus");

    channel.onmessage = (event) => {
      const data = event.data;
      if (!data) return;

      if (data.type === "STAFF_LOGOUT") {
        setIsLoggingOut(true);
        try {
          sessionStorage.clear();
          localStorage.removeItem("motoplex_admin_session");
        } catch {}
        window.location.replace("/admin/login?logged_out=true");
      } else if (data.type === "STAFF_LOCK") {
        setIsScreenLocked(true);
        sessionStorage.setItem("motoplex_screen_locked", "true");
      } else if (data.type === "STAFF_UNLOCK") {
        setIsScreenLocked(false);
        sessionStorage.removeItem("motoplex_screen_locked");
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  useEffect(() => {
    if (pathname === "/admin/login") return;

    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.success && json.data?.user) {
          setCurrentUser(json.data.user);
        }
      })
      .catch(() => {});
  }, [pathname]);

  // If on the dedicated staff login page, render children cleanly without admin shell
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLockScreen = () => {
    setIsScreenLocked(true);
    setPinInput("");
    setPinError("");
    sessionStorage.setItem("motoplex_screen_locked", "true");
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        const channel = new BroadcastChannel("motoplex_admin_bus");
        channel.postMessage({ type: "STAFF_LOCK" });
        channel.close();
      } catch {}
    }
  };

  const handleUnlockScreen = (customPin?: string) => {
    const pin = customPin !== undefined ? customPin : pinInput;
    if (pin === "2026" || pin === "motoplex2026") {
      setIsScreenLocked(false);
      setPinInput("");
      setPinError("");
      sessionStorage.removeItem("motoplex_screen_locked");
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        try {
          const channel = new BroadcastChannel("motoplex_admin_bus");
          channel.postMessage({ type: "STAFF_UNLOCK" });
          channel.close();
        } catch {}
      }
    } else {
      setPinError("Invalid PIN. Enter official 4-digit terminal PIN (Default: 2026).");
    }
  };

  const handlePinDigit = (digit: string) => {
    if (pinInput.length >= 4) return;
    const newPin = pinInput + digit;
    setPinInput(newPin);
    setPinError("");
    if (newPin.length === 4) {
      handleUnlockScreen(newPin);
    }
  };

  const handlePinBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setPinError("");
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    // Broadcast logout across all other open admin tabs immediately
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        const channel = new BroadcastChannel("motoplex_admin_bus");
        channel.postMessage({ type: "STAFF_LOGOUT" });
        channel.close();
      } catch {}
    }

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth-state-change"));
      try {
        sessionStorage.clear();
        localStorage.removeItem("motoplex_admin_session");
      } catch {}
      // Hard replace prevents client-side Next.js route cache collision and infinite redirect bounces
      window.location.replace("/admin/login?logged_out=true");
    }
  };

  const isModerator = currentUser?.role === "moderator";

  const allNavSections = [
    {
      title: "Main Operations",
      titleBn: "মূল পরিচালনা",
      links: [
        { label: "Dashboard Overview", href: "/admin", icon: LayoutDashboard },
        { label: "Orders & Shipping", href: "/admin/orders", icon: ShoppingCart },
        { label: "Workshop Bookings", href: "/admin/services", icon: Wrench },
        { label: "Products & Stock", href: "/admin/products", icon: Package },
        { label: "POS Counter Terminal", href: "/admin/pos", icon: Receipt },
      ],
    },
    {
      title: "Store & Marketing",
      titleBn: "ক্যাটালগ ও মার্কেটিং",
      links: [
        { label: "Product Categories", href: "/admin/categories", icon: FolderTree },
        { label: "Coupons & Discounts", href: "/admin/coupons", icon: Tag },
        { label: "Customer Reviews", href: "/admin/reviews", icon: ShieldCheck },
      ],
    },
    {
      title: "System & Analytics",
      titleBn: "রিপোর্ট ও সেটিংস",
      restrictedForModerator: true,
      links: [
        { label: "Sales & Profit Reports", href: "/admin/reports", icon: BarChart3 },
        { label: "Users & Roles", href: "/admin/users", icon: Users },
        { label: "Store Configuration", href: "/admin/settings", icon: Settings },
      ],
    },
  ];

  // RBAC: Hide System & Analytics for Moderator
  const navSections = allNavSections.filter(
    (sec) => !(isModerator && sec.restrictedForModerator)
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col lg:flex-row font-sans">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-black text-sm tracking-tight text-slate-900">MOTOPLEX ADMIN</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
              isModerator
                ? "bg-amber-100 text-amber-800 border border-amber-300"
                : "bg-red-100 text-red-800 border border-red-300"
            }`}
          >
            {isModerator ? "Moderator" : "Admin"}
          </span>
          <button
            onClick={handleLockScreen}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            title="Lock Terminal"
          >
            <Lock className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-slate-50"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Admin Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 shrink-0 bg-white border-r border-slate-200 p-5 flex flex-col justify-between overflow-y-auto transition-transform duration-300 lg:static lg:translate-x-0 shadow-xs ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-2xl tracking-tighter text-slate-950">
                    MOTOPLEX
                  </span>
                  <div className="flex h-3.5 w-2 rounded-xs overflow-hidden flex-col">
                    <span className="bg-emerald-600 flex-1 w-full" />
                    <span className="bg-white flex-1 w-full border-y border-slate-200" />
                    <span className="bg-red-600 flex-1 w-full" />
                  </div>
                </div>
                <span className="text-[11px] font-black tracking-[0.2em] text-red-600 uppercase -mt-0.5">
                  ADMIN CONSOLE
                </span>
              </div>
            </Link>

            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1.5 text-slate-500 hover:text-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Grouped Navigation */}
          <nav className="space-y-6 pt-2 font-medium">
            {navSections.map((sec) => (
              <div key={sec.title} className="space-y-1.5">
                <div className="px-3 pb-1 text-[11px] font-black tracking-wider uppercase text-slate-500 flex items-center justify-between">
                  <span>{sec.title}</span>
                  <span className="text-slate-400 font-semibold">{sec.titleBn}</span>
                </div>
                {sec.links.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-sm ${
                        isActive
                          ? "bg-red-600 text-white font-bold shadow-md shadow-red-600/20"
                          : "text-slate-700 hover:text-slate-950 hover:bg-slate-100 font-bold"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer with Role Status & Logout */}
        <div className="space-y-3 pt-6 border-t border-slate-200 text-xs">
          <div
            className={`p-3.5 rounded-xl border text-xs ${
              isModerator
                ? "bg-amber-50/80 border-amber-200 text-amber-900"
                : "bg-slate-50 border-slate-200 text-slate-700"
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold mb-1">
              {isModerator ? (
                <>
                  <Wrench className="w-4 h-4 text-amber-600" />
                  <span className="text-sm text-slate-950">Workshop Moderator</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm text-slate-950">Full Store Access</span>
                </>
              )}
            </div>
            <span className="text-slate-500 font-medium block">
              {isModerator
                ? "Limited Control (Orders, Workshop & POS)"
                : "Super Administrator (Dhaka HQ)"}
            </span>
          </div>

          {/* Quick Screen Lock Button for Counter Techs */}
          <button
            type="button"
            onClick={handleLockScreen}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-colors border border-slate-300 text-[11px] cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-slate-700" />
            <span>Lock Terminal (PIN)</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/"
              className="bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-slate-200 text-[11px]"
            >
              <Store className="w-3.5 h-3.5 text-red-600" />
              <span>Storefront</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="bg-red-50 hover:bg-red-100 text-red-700 font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-red-200 text-[11px] cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-100/70">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search orders, SKU, customers, parts..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-red-600 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm font-semibold">
            <div className="hidden sm:flex items-center gap-2 text-slate-700 font-bold text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Systems Normal</span>
            </div>

            {/* Role Badge in Header */}
            <span
              className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                isModerator
                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                  : "bg-red-100 text-red-900 border border-red-300"
              }`}
            >
              {isModerator ? "Operations Moderator" : "Super Administrator"}
            </span>

            {/* Quick Terminal Lock Button */}
            <button
              type="button"
              onClick={handleLockScreen}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
              title="Lock Terminal (PIN)"
            >
              <Lock className="w-3.5 h-3.5 text-slate-700" />
              <span className="hidden sm:inline">Lock Screen</span>
            </button>

            <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shadow-xs">
              {isModerator ? "OP" : "HQ"}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-5 sm:p-7 lg:p-8 w-full min-w-0">{children}</main>
      </div>

      {/* Luxury Session Termination HUD Overlay */}
      {isLoggingOut && (
        <div className="fixed inset-0 z-100 bg-zinc-950/80 backdrop-blur-md flex flex-col items-center justify-center text-white animate-in fade-in duration-200">
          <div className="w-14 h-14 rounded-2xl bg-red-950/80 border border-red-800/80 flex items-center justify-center mb-4 shadow-xl shadow-red-950/50">
            <LogOut className="w-6 h-6 text-red-500 animate-pulse" />
          </div>
          <div className="text-center space-y-1">
            <p className="font-bold text-sm tracking-tight text-white">Terminating Secure Session...</p>
            <p className="text-xs text-zinc-400 font-mono">Flushing cryptographic keys & locking console</p>
          </div>
        </div>
      )}

      {/* Showroom Fast PIN Screen Lock Overlay (Preserves live draft data) */}
      {isScreenLocked && !isLoggingOut && (
        <div className="fixed inset-0 z-90 bg-zinc-950/85 backdrop-blur-2xl flex items-center justify-center p-4 font-sans select-none animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-center">
            {/* Status Header */}
            <div className="space-y-1">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shadow-inner mb-2">
                <KeyRound className="w-6 h-6 text-red-500" />
              </div>
              <h2 className="text-lg font-black text-white tracking-tight">TERMINAL LOCKED</h2>
              <p className="text-xs text-zinc-400">
                Showroom & workshop session safely preserved
              </p>
            </div>

            {/* Staff Identity Pill */}
            <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800/80 flex items-center justify-between text-left">
              <div>
                <span className="text-xs font-bold text-white block">
                  {currentUser?.name || "Official Motoplex Staff"}
                </span>
                <span className="text-[11px] text-zinc-400 font-mono">
                  {currentUser?.email || "staff@motoplex.bd"}
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isModerator
                    ? "bg-amber-950 border border-amber-800 text-amber-300"
                    : "bg-red-950 border border-red-800 text-red-300"
                }`}
              >
                {isModerator ? "Moderator" : "Admin"}
              </span>
            </div>

            {/* PIN Circles */}
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-3 py-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-3.5 h-3.5 rounded-full border transition-all ${
                      pinInput.length > i
                        ? "bg-red-500 border-red-400 scale-110 shadow-sm shadow-red-500/50"
                        : "bg-zinc-800 border-zinc-700"
                    }`}
                  />
                ))}
              </div>
              {pinError && (
                <p className="text-[11px] text-red-400 font-medium animate-in fade-in">
                  {pinError}
                </p>
              )}
            </div>

            {/* 10-Key Touchpad for Counter & Tablets */}
            <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handlePinDigit(num)}
                  className="h-11 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-white font-bold text-sm transition-colors cursor-pointer active:scale-95"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setPinInput("");
                  setPinError("");
                }}
                className="h-11 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 font-bold text-xs transition-colors cursor-pointer active:scale-95"
              >
                C
              </button>
              <button
                type="button"
                onClick={() => handlePinDigit("0")}
                className="h-11 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-white font-bold text-sm transition-colors cursor-pointer active:scale-95"
              >
                0
              </button>
              <button
                type="button"
                onClick={handlePinBackspace}
                className="h-11 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                title="Backspace"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>

            {/* Master Hint & Unlock Actions */}
            <div className="pt-2 border-t border-zinc-800 space-y-2">
              <button
                type="button"
                onClick={() => handleUnlockScreen()}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md shadow-red-600/30 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>UNLOCK WORKSTATION</span>
              </button>

              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-zinc-500 font-mono">Terminal PIN: 2026</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-red-400 hover:text-red-300 font-semibold cursor-pointer underline"
                >
                  Full Sign Out →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
