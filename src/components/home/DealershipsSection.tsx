"use client";

import React from "react";
import { ShieldCheck, BadgeCheck, CheckCircle2, Star } from "lucide-react";

const authorizedBrands = [
  {
    id: "aprilia",
    brand: "Aprilia",
    origin: "Italy",
    logo: "A",
    gradient: "from-red-600 to-red-800",
    glow: "shadow-red-900/60",
    badge: "Piaggio Group Certified",
    badgeColor: "text-red-400 border-red-800/50 bg-red-950/60",
    desc: "Official Authorized Dealer",
  },
  {
    id: "vespa",
    brand: "Vespa",
    origin: "Italy",
    logo: "V",
    gradient: "from-slate-500 to-slate-700",
    glow: "shadow-slate-900/60",
    badge: "Vespa World Club Partner",
    badgeColor: "text-slate-300 border-slate-700/50 bg-slate-900/60",
    desc: "Official Authorized Dealer",
  },
  {
    id: "motoguzzi",
    brand: "Moto Guzzi",
    origin: "Italy",
    logo: "MG",
    gradient: "from-amber-500 to-amber-700",
    glow: "shadow-amber-900/60",
    badge: "Piaggio Group Exclusive",
    badgeColor: "text-amber-400 border-amber-800/50 bg-amber-950/60",
    desc: "Exclusive BD Importer",
  },
];

const guaranteePoints = [
  "Factory Hologram on every product",
  "Official import documentation",
  "International manufacturer warranty",
];

export function DealershipsSection() {
  return (
    <section className="bg-zinc-950 relative overflow-hidden">
      {/* Top accent line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-red-600/40 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-18">

        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/10 border border-red-600/20 text-[11px] text-red-400 font-bold uppercase tracking-wider mb-2">
              <BadgeCheck className="w-3 h-3" />
              Official Authorized Dealerships
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              WE ARE AN AUTHORIZED PARTNER OF
              <span className="text-red-500"> 3 ITALIAN BRANDS</span>
            </h2>
            <p className="text-zinc-500 text-xs mt-1.5 max-w-lg">
              Every product sold at Motoplex BD is 100% original — directly imported under{" "}
              <span className="text-zinc-300 font-semibold">official Piaggio Group authorization</span>.
            </p>
          </div>
          {/* Trust counter */}
          <div className="shrink-0 hidden sm:flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-red-600/10 border border-red-600/20">
            <span className="text-3xl font-black text-white leading-none">3</span>
            <span className="text-[9px] text-red-400 uppercase tracking-wider font-bold text-center leading-tight mt-0.5">
              Authorized<br />Brands
            </span>
          </div>
        </div>

        {/* 3 Brand Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {authorizedBrands.map((brand) => (
            <div
              key={brand.id}
              className="relative rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden hover:bg-white/[0.06] hover:border-white/[0.14] transition-all duration-300 group"
            >
              {/* Top color accent */}
              <div className={`h-[3px] w-full bg-gradient-to-r ${brand.gradient}`} />

              <div className="p-5 flex items-center gap-4">
                {/* Logo badge */}
                <div
                  className={`w-13 h-13 w-[52px] h-[52px] rounded-xl bg-gradient-to-br ${brand.gradient} shadow-lg ${brand.glow} flex items-center justify-center shrink-0`}
                >
                  <span className="text-white font-black text-base leading-none">{brand.logo}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h3 className="text-white font-black text-sm leading-tight">{brand.brand}</h3>
                    <ShieldCheck className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  </div>
                  <p className="text-zinc-500 text-[11px]">🇮🇹 {brand.origin} • {brand.desc}</p>
                  <div className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full border text-[10px] font-bold ${brand.badgeColor}`}>
                    <Star className="w-2.5 h-2.5" fill="currentColor" />
                    <span>{brand.badge}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Guarantee Strip */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-red-600/15 bg-gradient-to-r from-red-950/30 to-transparent px-5 py-4">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-sm">100% Original Product Guarantee</span>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5">
            {guaranteePoints.map((point, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                <span className="text-zinc-400 text-[11px]">{point}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-zinc-700/40 to-transparent" />
    </section>
  );
}
