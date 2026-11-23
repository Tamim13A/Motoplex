"use client";

import React from "react";
import Link from "next/link";
import { Phone, MapPin, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-zinc-950 text-zinc-400 border-t border-zinc-800 text-xs">
      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto py-14 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand & Story */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="font-black text-2xl tracking-tighter text-white">
                    MOTOPLEX
                  </span>
                  <div className="flex h-3.5 w-2 rounded-xs overflow-hidden flex-col">
                    <span className="bg-emerald-600 flex-1 w-full" />
                    <span className="bg-white flex-1 w-full" />
                    <span className="bg-red-600 flex-1 w-full" />
                  </div>
                </div>
                <span className="text-[9px] font-bold tracking-[0.22em] text-zinc-500 uppercase -mt-1">
                  BANGLADESH
                </span>
              </div>
            </Link>

            <p className="text-zinc-400 text-xs leading-relaxed max-w-sm">
              Motoplex Bangladesh is the authorized gateway for Italian motorcycling excellence. Importer and distributor of Aprilia, Vespa, Moto Guzzi, alongside world-championship certified gear from Shoei, Dainese, Alpinestars, and Akrapovič.
            </p>

            {/* Showroom Addresses */}
            <div className="space-y-2 pt-2 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-zinc-200">Flagship Showroom:</strong> Plot 12, Road 113, Gulshan-2, Dhaka 1212, Bangladesh
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-zinc-200">Chattogram Lounge:</strong> GEC Circle, Nasirabad, Chattogram 4000
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-red-500 shrink-0" />
                <span className="font-mono text-zinc-200 font-bold">+880 1700-MOTOPLEX</span>
              </div>
            </div>
          </div>

          {/* Catalog Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Performance Parts
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/category/brake-system" className="hover:text-white transition-colors">
                  Brake System & Racing Discs
                </Link>
              </li>
              <li>
                <Link href="/category/engine-performance" className="hover:text-white transition-colors">
                  Engine, Pistons & Cylinders
                </Link>
              </li>
              <li>
                <Link href="/category/air-filters" className="hover:text-white transition-colors">
                  High-Flow Performance Air Filters
                </Link>
              </li>
              <li>
                <Link href="/category/clutch-transmission" className="hover:text-white transition-colors">
                  Clutch Sets, Levers & Chains
                </Link>
              </li>
              <li>
                <Link href="/category/tyres" className="hover:text-white transition-colors">
                  Pirelli & Michelin Tyres
                </Link>
              </li>
              <li>
                <Link href="/category/lubricants-fluids" className="hover:text-white transition-colors">
                  Racing Oils & Maintenance Fluids
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service & Policies */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Customer Support
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/account/orders" className="hover:text-white transition-colors">
                  Track Delivery Status
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-white transition-colors">
                  Shipping & Courier Policy
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-white transition-colors">
                  7-Day Return & Replacement
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Book Private Consultation
                </Link>
              </li>
            </ul>
          </div>

          {/* Portals & Tracking */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Customer Portals
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/track" className="text-red-400 hover:text-red-300 font-bold transition-colors">
                  ✦ Track Order (লাইভ ট্র্যাকিং)
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-white transition-colors">
                  Customer Dashboard
                </Link>
              </li>
              <li>
                <Link href="/account/orders" className="hover:text-white transition-colors">
                  Order History & Invoices
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="hover:text-white transition-colors">
                  Saved Wishlist
                </Link>
              </li>
              <li>
                <Link href="/checkout" className="hover:text-white transition-colors">
                  Checkout
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Sign In / Register
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
