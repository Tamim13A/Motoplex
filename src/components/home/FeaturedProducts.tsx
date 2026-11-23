"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/shop/ProductCard";
import { QuickViewModal } from "@/components/ui/QuickViewModal";
import { products } from "@/data/products";
import { Product } from "@/types";
import { formatProduct } from "@/lib/productFormatter";

export function FeaturedProducts() {
  const [activeTab, setActiveTab] = useState("all");
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [productList, setProductList] = useState<Product[]>(() => {
    return products.map(formatProduct);
  });

  useEffect(() => {
    fetch("/api/products?limit=500", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.success && Array.isArray(json.data?.products) && json.data.products.length > 0) {
          setProductList(json.data.products.map(formatProduct));
        }
      })
      .catch(() => {});
  }, []);

  const tabs = [
    { id: "all", label: "All Featured" },
    { id: "brake-system", label: "Brake System" },
    { id: "engine-performance", label: "Engine & Performance" },
    { id: "air-filters", label: "Air Filters" },
    { id: "clutch-transmission", label: "Clutch & Chain" },
    { id: "tyres", label: "Performance Tyres" },
  ];

  const filteredProducts = useMemo(() => {
    return productList.filter((p) => {
      if (activeTab === "all") return p.isFeatured;
      return p.categorySlug === activeTab && p.isFeatured;
    }).slice(0, 8);
  }, [productList, activeTab]);

  return (
    <section className="py-16 md:py-24 bg-white border-b border-zinc-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">
              Engineered For The Track & Street
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-950 mt-1 tracking-tight">
              FEATURED PRODUCTS
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-lg">
              Hand-picked selection of top-tier racing parts, precision brake systems, and factory tuning components in Bangladesh.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-zinc-950 text-white shadow-sm"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-sm bg-zinc-50 rounded-2xl border border-zinc-200">
            No featured products found. Add products from the admin panel to display them here!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={(p) => setQuickViewProduct(p)}
              />
            ))}
          </div>
        )}

        {/* View All CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold px-8 py-4 rounded-xl shadow-md transition-all group"
          >
            <span>Explore Full Catalog</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </section>
  );
}
