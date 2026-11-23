"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  MapPin,
  ChevronDown,
  Shield,
  ShieldCheck,
  BadgeCheck,
  Truck,
  X,
  Package,
  LogOut,
  Phone,
} from "lucide-react";
import { MegaMenu } from "./MegaMenu";
import { MobileMenuDrawer } from "./MobileMenuDrawer";
import { CartDrawer } from "./CartDrawer";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { products } from "@/data/products";
import { Product } from "@/types";
import { formatProduct } from "@/lib/productFormatter";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { itemCount, subtotal, setIsCartOpen } = useCart();
  const { wishlist } = useWishlist();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcut (⌘K or / to search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA")) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // User auth & menu state
  const [currentUser, setCurrentUser] = useState<{
    id?: string;
    name?: string;
    email?: string;
    role?: string;
  } | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const syncUserAuth = React.useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json?.success && json.data?.user) {
          setCurrentUser(json.data.user);
          return;
        }
      }
      setCurrentUser(null);
    } catch {
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    syncUserAuth();
  }, [pathname, syncUserAuth]);

  useEffect(() => {
    const handleAuthChange = () => {
      syncUserAuth();
    };
    window.addEventListener("auth-state-change", handleAuthChange);
    return () => {
      window.removeEventListener("auth-state-change", handleAuthChange);
    };
  }, [syncUserAuth]);

  // Hover buffer ref to prevent accidental closing
  const megaMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleOpenMegaMenu = () => {
    if (megaMenuTimeoutRef.current) clearTimeout(megaMenuTimeoutRef.current);
    setIsMegaMenuOpen(true);
  };

  const handleCloseMegaMenu = () => {
    if (megaMenuTimeoutRef.current) clearTimeout(megaMenuTimeoutRef.current);
    megaMenuTimeoutRef.current = setTimeout(() => {
      setIsMegaMenuOpen(false);
    }, 200);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (megaMenuTimeoutRef.current) clearTimeout(megaMenuTimeoutRef.current);
    };
  }, []);

  // Filter search results
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const q = searchQuery.toLowerCase();
    const staticFiltered = products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.subcategory.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      )
      .slice(0, 5);

    setSearchResults(staticFiltered);

    const timer = setTimeout(() => {
      fetch(`/api/products?q=${encodeURIComponent(searchQuery)}&limit=5`, { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (json?.success && Array.isArray(json.data?.products) && json.data.products.length > 0) {
            setSearchResults(json.data.products.map(formatProduct));
          }
        })
        .catch(() => {});
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside search & user menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const isStaff = currentUser?.role === "admin" || currentUser?.role === "moderator";

    // Broadcast across all open admin tabs if staff
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        const channel = new BroadcastChannel("motoplex_admin_bus");
        channel.postMessage({ type: "STAFF_LOGOUT" });
        channel.close();
      } catch {}
    }

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}

    setCurrentUser(null);
    setIsUserMenuOpen(false);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth-state-change"));
      try {
        sessionStorage.clear();
        localStorage.removeItem("motoplex_admin_session");
      } catch {}

      if (isStaff) {
        window.location.replace("/admin/login?logged_out=true");
      } else {
        window.location.replace("/login?logged_out=true");
      }
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchFocused(false);
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white transition-all duration-300">
        {/* Top Announcement Bar — Auto-Scrolling Ticker */}
        <div className="bg-zinc-950 text-zinc-300 text-[11px] py-2 border-b border-zinc-800 overflow-hidden relative">
          {/* Scrolling ticker */}
          <div className="flex items-center">
            <div className="animate-ticker flex items-center gap-0 whitespace-nowrap will-change-transform">
              {[
                { icon: <Truck className="w-3.5 h-3.5 text-red-500 shrink-0" />, text: "Free Express Delivery across Bangladesh on orders above ৳5,000" },
                { icon: <ShieldCheck className="w-3.5 h-3.5 text-green-500 shrink-0" />, text: "Official Authorized Dealer — Aprilia Bangladesh" },
                { icon: <ShieldCheck className="w-3.5 h-3.5 text-green-500 shrink-0" />, text: "Official Authorized Dealer — Vespa Bangladesh" },
                { icon: <ShieldCheck className="w-3.5 h-3.5 text-green-500 shrink-0" />, text: "Official Authorized Dealer — Moto Guzzi Bangladesh" },
                { icon: <BadgeCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />, text: "100% Original Products — Piaggio Group Certified & Factory Verified" },
                { icon: <Truck className="w-3.5 h-3.5 text-red-500 shrink-0" />, text: "Free Express Delivery across Bangladesh on orders above ৳5,000" },
                { icon: <ShieldCheck className="w-3.5 h-3.5 text-green-500 shrink-0" />, text: "Official Authorized Dealer — Aprilia Bangladesh" },
                { icon: <ShieldCheck className="w-3.5 h-3.5 text-green-500 shrink-0" />, text: "Official Authorized Dealer — Vespa Bangladesh" },
                { icon: <ShieldCheck className="w-3.5 h-3.5 text-green-500 shrink-0" />, text: "Official Authorized Dealer — Moto Guzzi Bangladesh" },
                { icon: <BadgeCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />, text: "100% Original Products — Piaggio Group Certified & Factory Verified" },
              ].map((item, i) => (
                <span key={i} className="inline-flex items-center gap-2 px-8 text-zinc-300 font-medium">
                  {item.icon}
                  <span>{item.text}</span>
                  <span className="text-zinc-700 ml-8">✦</span>
                </span>
              ))}
            </div>
          </div>
        </div>


        {/* Tier 1: Main Header (Logo, Centered Search & Action Utilities) */}
        <div
          className={`transition-all duration-200 relative border-b ${
            isScrolled
              ? "bg-white/95 backdrop-blur-xl border-zinc-200/80 shadow-xs py-2 sm:py-2.5"
              : "bg-white border-zinc-200/60 py-3 sm:py-3.5"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sm:gap-6">
            {/* Left: Mobile hamburger & Brand Logo */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 -ml-2 text-zinc-700 hover:text-zinc-950 lg:hidden rounded-lg hover:bg-zinc-100"
                aria-label="Open mobile menu"
              >
                <Menu className="w-6 h-6" />
              </button>

              <Link href="/" className="flex items-center gap-3.5 group shrink-0">
                <div className="relative h-12 sm:h-14 w-16 sm:w-20 shrink-0 rounded-xl overflow-hidden bg-black p-0.5 border border-zinc-800 shadow-sm group-hover:border-red-600/70 transition-all">
                  <Image
                    src="/logo.jpg"
                    alt="Motoplex Performance Division"
                    fill
                    className="object-contain group-hover:scale-105 transition-transform duration-200"
                    priority
                  />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-2xl sm:text-3xl tracking-tighter text-zinc-950 group-hover:text-red-600 transition-colors leading-none">
                      MOTOPLEX
                    </span>
                    {/* Italian Tricolor Accent Bars */}
                    <div className="flex h-4 w-2 rounded-xs overflow-hidden flex-col shadow-xs shrink-0">
                      <span className="bg-emerald-600 flex-1 w-full" />
                      <span className="bg-white flex-1 w-full" />
                      <span className="bg-red-600 flex-1 w-full" />
                    </div>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-black tracking-[0.24em] text-red-600 uppercase mt-1 leading-none">
                    PERFORMANCE DIVISION
                  </span>
                </div>
              </Link>
            </div>

            {/* Center: Live Autocomplete Search Bar */}
            <div ref={searchRef} className="relative hidden md:block flex-1 max-w-xl mx-2 lg:mx-6">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search performance parts, gear, models..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  className="w-full bg-zinc-50 hover:bg-zinc-100/80 focus:bg-white border border-zinc-200 focus:border-red-600 rounded-full pl-10 pr-14 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-600/10 transition-all shadow-2xs"
                />
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                {!searchQuery && (
                  <span className="hidden lg:inline-flex items-center px-1.5 py-0.5 border border-zinc-200 rounded text-[10px] font-mono text-zinc-400 absolute right-3.5 top-2.5 select-none pointer-events-none">
                    ⌘K
                  </span>
                )}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="p-1 text-zinc-400 hover:text-zinc-600 absolute right-3 top-2.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>

              {/* Autocomplete Dropdown Preview */}
              {isSearchFocused && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden z-50 animate-in fade-in duration-150">
                  {searchResults.length > 0 ? (
                    <div className="p-2 space-y-1">
                      <p className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Matching Products
                      </p>
                      {searchResults.map((prod) => (
                        <Link
                          key={prod.id}
                          href={`/product/${prod.slug}`}
                          onClick={() => {
                            setIsSearchFocused(false);
                            setSearchQuery("");
                          }}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-50 transition-colors group"
                        >
                          <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-zinc-100 shrink-0">
                            <Image
                              src={prod.images?.[0] || "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=600&auto=format&fit=crop"}
                              alt=""
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-zinc-900 group-hover:text-red-600 truncate">
                              {prod.name}
                            </h4>
                            <p className="text-[10px] text-zinc-500">{prod.brand}</p>
                          </div>
                          <span className="text-xs font-bold text-zinc-950">
                            ৳{Number(prod.price || 0).toLocaleString("en-BD")}
                          </span>
                        </Link>
                      ))}
                      <div className="pt-2 border-t border-zinc-100 text-center">
                        <button
                          onClick={handleSearchSubmit}
                          className="text-xs font-semibold text-red-600 hover:underline py-1"
                        >
                          View all results for &ldquo;{searchQuery}&rdquo; →
                        </button>
                      </div>
                    </div>
                  ) : searchQuery.trim().length > 1 ? (
                    <div className="p-6 text-center text-xs text-zinc-500">
                      No products found for &ldquo;{searchQuery}&rdquo;.
                    </div>
                  ) : (
                    <div className="p-4 space-y-3">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Trending Searches in Bangladesh
                      </p>
                      <div className="flex flex-wrap gap-1.5 text-xs">
                        {[
                          "DND Disc 320mm",
                          "NLK Piston Cylinder",
                          "Hurricane Air Filter",
                          "Pirelli Diablo Rosso",
                          "RPD Brake Caliper",
                          "BIKERS Foot Rest",
                          "Liqui Moly Engine Oil",
                        ].map((trend) => (
                          <button
                            key={trend}
                            onClick={() => {
                              setSearchQuery(trend);
                              router.push(`/shop?q=${encodeURIComponent(trend)}`);
                              setIsSearchFocused(false);
                            }}
                            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs px-2.5 py-1 rounded-full transition-colors"
                          >
                            {trend}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Action Icons & Utilities */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* Showroom Hotline */}
              <a
                href="tel:+8801957060531"
                className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl text-zinc-700 hover:text-red-600 hover:bg-zinc-50 transition-colors border border-transparent hover:border-zinc-200"
                title="Direct Showroom & Support Hotline"
              >
                <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider leading-none">Support</p>
                  <p className="text-xs font-black text-zinc-900 leading-tight">+880 1957-060531</p>
                </div>
              </a>

              {/* If staff is logged in, show quick 1-click shortcut to Admin Console */}
              {currentUser && (currentUser.role === "admin" || currentUser.role === "moderator") && (
                <Link
                  href="/admin"
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all border border-red-200 shadow-2xs"
                  title="Open Admin Operations Console"
                >
                  <Shield className="w-3.5 h-3.5 text-red-600" />
                  <span>Admin Console</span>
                </Link>
              )}

              {/* Customer Login Button (ONLY When Not Signed In) */}
              {!currentUser && (
                <Link
                  href="/login"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-zinc-900 hover:text-red-600 hover:bg-zinc-100 rounded-xl transition-colors border border-zinc-200 shadow-2xs"
                  title="Customer Login & Orders"
                >
                  <User className="w-3.5 h-3.5 text-red-600" />
                  <span>Customer Login</span>
                </Link>
              )}

              {/* User Account with Interactive Dropdown */}
              <div ref={userMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="p-2 text-zinc-700 hover:text-zinc-950 rounded-xl hover:bg-zinc-100 transition-colors flex items-center gap-1.5 cursor-pointer relative"
                  title="My Account"
                  aria-expanded={isUserMenuOpen}
                >
                  {currentUser ? (
                    <div className="w-7 h-7 rounded-full bg-red-600 text-white text-xs font-black flex items-center justify-center shadow-xs">
                      {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
                    </div>
                  ) : (
                    <User className="w-5 h-5 text-zinc-700" />
                  )}
                  {currentUser && (
                    <span className="hidden xl:inline text-xs font-bold text-zinc-900 max-w-[90px] truncate">
                      {currentUser.name?.split(" ")[0]}
                    </span>
                  )}
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                    {currentUser ? (
                      <div className="p-4 space-y-3">
                        <div className="pb-3 border-b border-zinc-100">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-zinc-900 truncate">
                              {currentUser.name}
                            </span>
                            <span
                              className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                                currentUser.role === "admin"
                                  ? "bg-red-50 text-red-600 border border-red-200"
                                  : currentUser.role === "moderator"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-red-50 text-red-600 border border-red-200"
                              }`}
                            >
                              {currentUser.role === "admin"
                                ? "Super Admin"
                                : currentUser.role === "moderator"
                                ? "Moderator"
                                : "VIP Rider"}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                            {currentUser.email}
                          </p>
                        </div>

                        <div className="space-y-1 text-xs">
                          <Link
                            href="/account"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 p-2 rounded-xl text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors font-medium"
                          >
                            <User className="w-4 h-4 text-zinc-500" />
                            <span>Account Overview</span>
                          </Link>
                          <Link
                            href="/account/orders"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 p-2 rounded-xl text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors font-medium"
                          >
                            <Package className="w-4 h-4 text-zinc-500" />
                            <span>My Orders</span>
                          </Link>
                          <Link
                            href="/account/addresses"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 p-2 rounded-xl text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors font-medium"
                          >
                            <MapPin className="w-4 h-4 text-zinc-500" />
                            <span>Saved Addresses</span>
                          </Link>
                          {(currentUser.role === "admin" || currentUser.role === "moderator") && (
                            <Link
                              href="/admin"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-2.5 p-2 rounded-xl text-red-600 hover:bg-red-50 transition-colors font-semibold"
                            >
                              <Shield className="w-4 h-4 text-red-600" />
                              <span>Staff Operations Console</span>
                            </Link>
                          )}
                        </div>

                        <div className="pt-2 border-t border-zinc-100">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-zinc-600 hover:text-red-600 hover:bg-red-50/50 transition-colors cursor-pointer text-left"
                          >
                            <LogOut className="w-4 h-4 text-zinc-400 group-hover:text-red-600" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 space-y-3 text-xs">
                        <div>
                          <p className="font-bold text-zinc-900">Motoplex Bangladesh</p>
                          <p className="text-[11px] text-zinc-500 mt-0.5">
                            Sign in to track live orders and access member club benefits.
                          </p>
                        </div>
                        <div className="space-y-2 pt-1">
                          <Link
                            href="/login"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-bold py-2 px-3 rounded-xl flex items-center justify-center transition-colors shadow-xs"
                          >
                            Sign In
                          </Link>
                          <Link
                            href="/register"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold py-2 px-3 rounded-xl flex items-center justify-center transition-colors"
                          >
                            Create Account
                          </Link>
                        </div>
                        <div className="pt-2 border-t border-zinc-100">
                          <Link
                            href="/account/orders"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2 text-zinc-600 hover:text-red-600 transition-colors py-1 font-medium"
                          >
                            <Package className="w-3.5 h-3.5 text-zinc-400" />
                            <span>Track Order Status</span>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="p-2 text-zinc-700 hover:text-zinc-950 rounded-xl hover:bg-zinc-100 transition-colors relative active:scale-90"
                title="Wishlist"
              >
                <Heart className="w-5 h-5" />
                {wishlist.length > 0 && (
                  <span className="absolute top-1 right-1 bg-zinc-900 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-badge-pop shadow-2xs">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              {/* Cart Drawer Trigger Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="flex items-center gap-2.5 bg-zinc-950 hover:bg-zinc-850 text-white pl-3 pr-4 py-2 rounded-xl transition-all shadow-md shadow-black/10 active:scale-95 group cursor-pointer border border-zinc-800/80"
                aria-label="View shopping cart"
              >
                <div className="relative">
                  <ShoppingBag className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
                  {itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-badge-pop shadow-xs">
                      {itemCount}
                    </span>
                  )}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-[10px] text-zinc-400 font-medium leading-none">Cart</span>
                  <span className="text-xs font-bold text-white leading-tight font-mono">
                    ৳{subtotal.toLocaleString("en-BD")}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Mobile Search Input */}
          <div className="md:hidden px-4 pt-2.5 pb-1">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search performance parts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-100 focus:bg-white border border-zinc-200 focus:border-red-600 rounded-xl pl-9 pr-8 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-1 text-zinc-400 hover:text-zinc-600 absolute right-2.5 top-2"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Tier 2: Category & Models Navigation Bar (Desktop) */}
        <div
          className="hidden lg:block bg-zinc-950 text-white border-b border-zinc-800 relative shadow-sm"
          onMouseLeave={handleCloseMegaMenu}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-2">
            <div className="flex items-center gap-6 xl:gap-8">
              {/* Mega Menu Toggle Button */}
              <div onMouseEnter={handleOpenMegaMenu} className="py-0.5">
                <button
                  type="button"
                  onClick={() => setIsMegaMenuOpen((prev) => !prev)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    isMegaMenuOpen
                      ? "bg-red-600 text-white shadow-xs"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  }`}
                >
                  <Menu className="w-3.5 h-3.5" />
                  <span>Categories & Models</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isMegaMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Direct Category Links */}
              <nav className="flex items-center gap-5 xl:gap-7 text-xs font-bold uppercase tracking-wider text-zinc-300">
                <Link
                  href="/category/brake-system"
                  prefetch={true}
                  className="hover:text-red-500 transition-colors py-1"
                >
                  Brake System
                </Link>
                <Link
                  href="/category/engine-performance"
                  prefetch={true}
                  className="hover:text-red-500 transition-colors py-1"
                >
                  Engine & Tuning
                </Link>
                <Link
                  href="/category/air-filters"
                  prefetch={true}
                  className="hover:text-red-500 transition-colors py-1"
                >
                  Air Filters
                </Link>
                <Link
                  href="/category/clutch-transmission"
                  prefetch={true}
                  className="hover:text-red-500 transition-colors py-1"
                >
                  Clutch & Chain
                </Link>
                <Link
                  href="/category/tyres"
                  prefetch={true}
                  className="hover:text-red-500 transition-colors py-1"
                >
                  Tyres
                </Link>
                <Link
                  href="/services"
                  prefetch={true}
                  className="text-white hover:text-red-500 transition-colors flex items-center gap-1.5 py-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span>Workshop & Services</span>
                </Link>
              </nav>
            </div>

            {/* Right Quick Nav Links */}
            <div className="flex items-center gap-5 text-xs font-bold uppercase tracking-wider text-zinc-400">
              <Link
                href="/dealerships"
                prefetch={true}
                className="hover:text-white transition-colors"
              >
                Dealerships
              </Link>
              <Link
                href="/track"
                prefetch={true}
                className="hover:text-white transition-colors flex items-center gap-1.5"
              >
                <Truck className="w-3.5 h-3.5 text-red-500" />
                <span>Track Order</span>
              </Link>
              <Link
                href="/shop"
                prefetch={true}
                className="text-red-500 hover:text-red-400 font-black transition-colors"
              >
                All Products →
              </Link>
            </div>
          </div>

          {/* Full-width Mega Menu anchored right below Tier 2 */}
          {isMegaMenuOpen && (
            <div
              onMouseEnter={handleOpenMegaMenu}
              onMouseLeave={handleCloseMegaMenu}
              className="w-full absolute top-full left-0 right-0 z-50 shadow-2xl"
            >
              <MegaMenu onClose={() => setIsMegaMenuOpen(false)} />
            </div>
          )}
        </div>
      </header>

      {/* Slide-out Drawers */}
      <CartDrawer />
      <MobileMenuDrawer isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </>
  );
}
