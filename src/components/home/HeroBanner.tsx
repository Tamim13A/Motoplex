"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Zap, Award, ChevronLeft, ChevronRight, Flame } from "lucide-react";

const heroSlides = [
  {
    id: "slide-1",
    tag: "High-Performance Braking Division",
    badge: "DND & RPD Multi-Pot Systems",
    headline: ["Precision track bite,", "heat-dissipating alloy,", "unrivaled lever control"],
    description:
      "Direct importer of DND floating brake discs, RPD Zenith multi-pot calipers, radial master cylinders, and Frando racing pads for Yamaha R15, Honda CBR, and Suzuki GSX-R.",
    primaryCta: { href: "/category/brake-system", label: "Explore Brake Systems" },
    secondaryCta: { href: "/shop?category=brake-system", label: "All Brake Rotors" },
    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "DND Floating Brake Rotor Motoplex BD",
    cardTitle: "DND 320mm Racing Disc",
    cardSub: "Floating Rotor • CNC Center Carrier",
    cardBadge: "Race Division",
    cardPrice: "৳6,500",
    stats: [
      { value: "320mm", label: "Rotor Diameter" },
      { value: "Grade 5", label: "Floating Pins" },
      { value: "64 Districts", label: "Express Delivery" },
    ],
  },
  {
    id: "slide-2",
    tag: "Engine & Performance Tuning",
    badge: "NLK Racing Cylinder Kits",
    headline: ["Race-grade compression,", "forged resilience,", "maximum track RPM"],
    description:
      "Official dealer for NLK Racing cylinders, high-lift camshafts, big valve heads, throttle bodies, programmable ECUs, and racing fuel pumps in Bangladesh.",
    primaryCta: { href: "/category/engine-performance", label: "View Engine Parts" },
    secondaryCta: { href: "/shop?category=engine-performance", label: "Performance Kits" },
    image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "NLK Racing Engine Performance Kit Motoplex",
    cardTitle: "NLK Piston Cylinder 65mm",
    cardSub: "Forged Piston • High-Flow Bore Kit",
    cardBadge: "Track Pro",
    cardPrice: "৳16,000",
    stats: [
      { value: "65mm", label: "Bore Size" },
      { value: "Forged", label: "Piston Alloy" },
      { value: "Genuine", label: "NLK Authenticity" },
    ],
  },
  {
    id: "slide-3",
    tag: "Supersport Compound Tyres",
    badge: "Pirelli Diablo Rosso & Michelin",
    headline: ["Lean-angle mastery,", "wet and dry traction,", "high-speed stability"],
    description:
      "Equip your machine with genuine Pirelli Diablo Rosso IV, Rosso Sport, and Michelin Road 6 radial tyres designed for maximum cornering confidence across Bangladesh.",
    primaryCta: { href: "/category/tyres", label: "Shop Performance Tyres" },
    secondaryCta: { href: "/shop?category=tyres", label: "View Tyre Pair Sets" },
    image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Pirelli Diablo Rosso Motoplex BD",
    cardTitle: "Pirelli Rosso 4 Tyre Pair",
    cardSub: "110/70 Front + 140/70 Rear Set",
    cardBadge: "Supersport",
    cardPrice: "৳33,000",
    stats: [
      { value: "Dual Compound", label: "Silica Tread" },
      { value: "W-Rated", label: "High-Speed" },
      { value: "In Stock", label: "Fresh Import" },
    ],
  },
];

export function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  }, []);

  // Auto-advance every 6 seconds when not paused by user hover
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const slide = heroSlides[currentSlide];

  return (
    <section
      className="relative bg-zinc-950 text-white overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Top Italian Tricolore Ribbon */}
      <div className="w-full h-1 tricolore-accent" />

      {/* Subtle track-grid texture backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-28 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Hero Content */}
          <div
            className="lg:col-span-7 space-y-6 text-center lg:text-left transition-all duration-500 transform-gpu"
            key={slide.id}
            style={{ animation: "fade-in-up 0.4s cubic-bezier(0.16,1,0.3,1) forwards" }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
              <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
              <span className="font-semibold text-white">{slide.tag}</span>
              <span className="text-zinc-600">•</span>
              <span className="text-red-500 font-bold uppercase tracking-wider text-[10px]">
                {slide.badge}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] text-white">
              {slide.headline.map((line, i) => (
                <span key={i} className="block text-white">
                  {line}
                </span>
              ))}
            </h1>

            <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto lg:mx-0 leading-relaxed min-h-[48px]">
              {slide.description}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                href={slide.primaryCta.href}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-sm px-8 py-4 rounded-xl shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2 group active:scale-98"
              >
                <span>{slide.primaryCta.label}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </Link>
              <Link
                href={slide.secondaryCta.href}
                className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 font-semibold text-sm px-7 py-4 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <span>{slide.secondaryCta.label}</span>
              </Link>
            </div>

            {/* Stats Row */}
            <div className="pt-6 border-t border-zinc-800/80 grid grid-cols-3 gap-4 text-center lg:text-left">
              {slide.stats.map((stat, i) => (
                <div key={i}>
                  <p className="text-xl sm:text-2xl font-black text-white">{stat.value}</p>
                  <p className="text-[11px] text-zinc-400 uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Hero Visual: Layered Pre-rendered GPU Crossfade */}
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-4/3 sm:aspect-[16/11] w-full rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-2xl group">
              {heroSlides.map((s, idx) => {
                const isActive = idx === currentSlide;
                return (
                  <div
                    key={s.id}
                    className={`absolute inset-0 transition-all duration-700 ease-out transform-gpu ${
                      isActive
                        ? "opacity-100 scale-100 z-10 pointer-events-auto"
                        : "opacity-0 scale-98 z-0 pointer-events-none"
                    }`}
                  >
                    <Image
                      src={s.image}
                      alt={s.imageAlt}
                      fill
                      priority={idx === 0}
                      className="object-cover transition-transform duration-1000 group-hover:scale-105"
                      sizes="(max-width: 1024px) 100vw, 45vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />

                    {/* Floating Info Chip */}
                    <div className="absolute bottom-5 inset-x-5 flex items-center justify-between bg-zinc-950/85 backdrop-blur-md p-4 rounded-2xl border border-zinc-800 text-xs shadow-xl">
                      <div>
                        <div className="flex items-center gap-1.5 text-red-500 font-bold uppercase tracking-wider text-[10px]">
                          <Flame className="w-3.5 h-3.5" />
                          {s.cardBadge}
                        </div>
                        <h3 className="font-bold text-white text-sm mt-0.5">{s.cardTitle}</h3>
                        <p className="text-[11px] text-zinc-400">{s.cardSub}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-zinc-400 block">Ex-Showroom BD</span>
                        <span className="text-sm font-black text-white">{s.cardPrice}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Slide Navigation Dots + Arrow Buttons */}
            <div className="flex items-center justify-center gap-4 mt-5">
              <button
                type="button"
                onClick={prevSlide}
                className="p-2 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white cursor-pointer active:scale-95"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                {heroSlides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => goToSlide(i)}
                    className={`transition-all duration-300 rounded-full cursor-pointer ${
                      i === currentSlide
                        ? "w-7 h-2 bg-red-600 shadow-sm shadow-red-600/50"
                        : "w-2 h-2 bg-zinc-700 hover:bg-zinc-500"
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={nextSlide}
                className="p-2 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white cursor-pointer active:scale-95"
                aria-label="Next slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Trust Bar */}
      <div className="border-t border-zinc-800 bg-zinc-900/60 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-zinc-300">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-red-500 shrink-0" />
            <span>100% Genuine Importer Hologram</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-red-500 shrink-0" />
            <span>24–48h Express Dhaka Delivery</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Award className="w-4 h-4 text-red-500 shrink-0" />
            <span>2-Year Official Engine Warranty</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-red-500 font-bold shrink-0">COD</span>
            <span>Cash on Delivery with Inspection</span>
          </div>
        </div>
      </div>
    </section>
  );
}
