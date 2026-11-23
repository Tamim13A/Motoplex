"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";
import { ProductCard } from "@/components/shop/ProductCard";
import { QuickViewModal } from "@/components/ui/QuickViewModal";
import { products } from "@/data/products";
import { Product } from "@/types";
import { formatProduct } from "@/lib/productFormatter";

export function BestSellers() {
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [productList, setProductList] = useState<Product[]>(() => {
    return products.filter((p) => p.isBestSeller).map(formatProduct);
  });

  useEffect(() => {
    fetch("/api/products?bestSeller=true&limit=8")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.success && Array.isArray(json.data?.products)) {
          setProductList(json.data.products.map(formatProduct));
        }
      })
      .catch(() => {});
  }, []);

  const bestSellerProducts = productList.filter((p) => p.isBestSeller).slice(0, 4);

  return (
    <section className="py-16 md:py-24 bg-zinc-50 border-b border-zinc-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 uppercase tracking-widest">
              <Trophy className="w-3.5 h-3.5" />
              <span>Rider Favorites in Bangladesh</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-950 mt-1 tracking-tight">
              BEST SELLING PRODUCTS
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-lg">
              The highest rated genuine motorcycle spare parts, racing accessories, and tuning equipment chosen by riders across Bangladesh.
            </p>
          </div>

          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-900 hover:text-red-600 transition-colors uppercase tracking-wider"
          >
            <span>View All Best Sellers</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {bestSellerProducts.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-sm bg-white rounded-2xl border border-zinc-200">
            No products in best sellers yet. New arrivals will appear here once added!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestSellerProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={(p) => setQuickViewProduct(p)}
              />
            ))}
          </div>
        )}
      </div>

      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </section>
  );
}
