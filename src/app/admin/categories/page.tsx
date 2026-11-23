"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Search, ExternalLink } from "lucide-react";
import { categories } from "@/data/categories";

export default function AdminCategoriesPage() {
  const [search, setSearch] = useState("");

  const filtered = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.subcategories.some((s) => s.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard Overview
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
            PRODUCT CATEGORIES & SUBGROUPS
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Visual hierarchy and classification for performance motorcycle parts, racing components & accessories
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search categories or subcategories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-red-600 transition-colors shadow-2xs"
          />
        </div>
      </div>

      {/* Category Cards Grid */}
      <div className="grid grid-cols-1 gap-5">
        {filtered.map((cat) => (
          <div
            key={cat.id}
            className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4"
          >
            {/* Category Header */}
            <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-200 gap-3">
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-2xs">
                  <Image src={cat.image} alt={cat.name} fill className="object-cover" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                    <span>{cat.name}</span>
                    <span className="text-xs font-mono text-slate-500 font-semibold">/{cat.slug}</span>
                  </h2>
                  <p className="text-sm text-slate-600 mt-0.5 max-w-2xl">{cat.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3.5 py-1.5 rounded-full border border-slate-200">
                  {cat.itemCount} Units in Catalog
                </span>
                <Link
                  href={`/category/${cat.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 px-3.5 py-1.5 bg-red-50 border border-red-200 rounded-full transition-colors shadow-2xs"
                >
                  <span>View Storefront</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Subcategories */}
            <div className="space-y-3 pt-1">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Subcategories & Product Types:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {cat.subcategories.map((sub, sIdx) => (
                  <div
                    key={`${cat.id}-${sub.slug || sub.id}-${sIdx}`}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-sm shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-950 text-sm">{sub.name}</h4>
                      <span className="text-xs text-slate-500 font-mono font-medium">/{sub.slug}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-slate-200/80">
                      {sub.childCategories.map((child, cIdx) => (
                        <span
                          key={`${cat.id}-${sub.slug}-${child.slug || child.id}-${cIdx}`}
                          className="bg-white border border-slate-200 text-slate-800 font-semibold text-xs px-2.5 py-1 rounded-lg shadow-2xs"
                        >
                          {child.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
