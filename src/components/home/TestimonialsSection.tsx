"use client";

import React from "react";
import Image from "next/image";
import { Star, ShieldCheck, Quote } from "lucide-react";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar: string;
  quote: string;
  rating: number;
  verified: boolean;
}

const homeTestimonials: Testimonial[] = [
  {
    id: "t1",
    name: "Mahir Faisal",
    role: "President, Desi Bikers Club",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
    quote: "Motoplex BD has transformed motorcycle culture in Bangladesh. Getting authentic European riding gear and genuine Italian parts with official warranties was nearly impossible before.",
    rating: 5,
    verified: true,
  },
  {
    id: "t2",
    name: "Sadia Anjum",
    role: "Urban Commuter & Vespa Rider",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop",
    quote: "The ordering experience is flawless. Fast doorstep delivery, cash on delivery with inspection option, and authentic products with verifiable importer serial numbers.",
    rating: 5,
    verified: true,
  },
  {
    id: "t3",
    name: "Zubair Al-Mamun",
    role: "Track Day Enthusiast",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop",
    quote: "From Dainese racing suits to Akrapovič exhausts, everything is 100% original. Their customer service team in Mirpur 60 Feet knows motorcycling inside and out.",
    rating: 5,
    verified: true,
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-16 md:py-24 bg-zinc-50 border-b border-zinc-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-red-600 uppercase tracking-widest">
            Rider Community & Trust
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-950 mt-1 tracking-tight">
            TRUSTED BY RIDERS ACROSS BANGLADESH
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 mt-2 leading-relaxed">
            Read firsthand experiences from motorcycle track champions, daily commuters, and weekend tourers.
          </p>
        </div>

        {/* 3 Prominent Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {homeTestimonials.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-2xl p-7 border border-zinc-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative"
            >
              <Quote className="w-8 h-8 text-zinc-200 absolute top-6 right-6 pointer-events-none" />

              <div>
                {/* Rating */}
                <div className="flex items-center gap-1 text-amber-500 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              <div className="flex items-center gap-3 pt-6 mt-6 border-t border-zinc-100">
                <div className="relative w-11 h-11 rounded-full overflow-hidden bg-zinc-200 shrink-0 border border-zinc-200">
                  <Image src={t.avatar} alt={t.name} fill className="object-cover" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-zinc-900 flex items-center gap-1.5">
                    {t.name}
                    {t.verified && (
                      <span title="Verified Customer">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-zinc-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Official Motoplex Trust Guarantee Bar */}
        <div className="mt-10 p-6 bg-white rounded-2xl border border-zinc-200/80 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-900 uppercase tracking-wide">
                Official Motoplex Bangladesh Importer Guarantee
              </p>
              <p className="text-[11px] text-zinc-500">
                100% Genuine European Equipment, Verifiable Importer Serial Numbers & Cash on Delivery Nationwide
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-xs font-black text-zinc-900">Official Distributor</span>
          </div>
        </div>
      </div>
    </section>
  );
}
