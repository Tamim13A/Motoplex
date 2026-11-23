"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Star, ShoppingBag, Heart, Eye, Check, Zap } from "lucide-react";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

export function ProductCard({ product, onQuickView }: ProductCardProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [added, setAdded] = useState(false);

  const isWishlisted = isInWishlist(product.id);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleOrderNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    router.push("/checkout");
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const handleQuickViewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickView?.(product);
  };

  // Determine badge
  let badgeText = "";
  let badgeClass = "bg-zinc-900 text-white";

  if (product.discountPercentage && product.discountPercentage > 0) {
    badgeText = `-${product.discountPercentage}%`;
    badgeClass = "bg-red-600 text-white";
  } else if (product.isNewArrival) {
    badgeText = "New";
    badgeClass = "bg-zinc-900 text-white";
  } else if (product.isBestSeller) {
    badgeText = "Best Seller";
    badgeClass = "bg-amber-600 text-white";
  }

  return (
    <div
      className="group card-luxury relative bg-white rounded-2xl border border-zinc-200/80 hover:border-zinc-300/90 flex flex-col overflow-hidden will-change-transform transform-gpu"
    >
      {/* Image Container */}
      <div className="relative aspect-square w-full bg-zinc-50 overflow-hidden">
        <Link href={`/product/${product.slug}`} className="relative block w-full h-full">
          {/* Primary image */}
          <Image
            src={product.images?.[0] || "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=600&auto=format&fit=crop"}
            alt={product.name}
            fill
            className={`object-cover transition-all duration-500 ease-out transform-gpu group-hover:scale-106 ${
              (product.images?.length || 0) > 1 ? "group-hover:opacity-0" : ""
            }`}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />

          {/* Secondary image crossfade */}
          {(product.images?.length || 0) > 1 && product.images?.[1] && (
            <Image
              src={product.images[1]}
              alt={`${product.name} - view 2`}
              fill
              loading="lazy"
              className="object-cover opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out transform-gpu group-hover:scale-106"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          )}
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
          {badgeText && (
            <span
              className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm ${badgeClass}`}
            >
              {badgeText}
            </span>
          )}
          {product.stock <= 3 && product.stock > 0 && (
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/30 flex items-center gap-1 backdrop-blur-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              Only {product.stock} left
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={handleWishlistToggle}
          className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-md transition-all duration-200 cursor-pointer active:scale-90 ${
            isWishlisted
              ? "bg-red-50 text-red-600 shadow-md scale-105 animate-heart-pop"
              : "bg-white/80 hover:bg-white text-zinc-600 hover:text-zinc-950 shadow-sm"
          }`}
          title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-label="Wishlist toggle"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? "fill-red-600 text-red-600" : ""}`} />
        </button>

        {/* Mobile Quick Action Buttons (Bottom Right) */}
        <div className="md:hidden absolute bottom-3 right-3 z-10 flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleQuickAdd}
            className={`p-2 rounded-full shadow-md transition-all active:scale-90 cursor-pointer ${
              added ? "bg-emerald-600 text-white" : "bg-white/95 text-zinc-900 border border-zinc-200"
            }`}
            aria-label="Quick add to cart"
          >
            {added ? <Check className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5 text-red-600" />}
          </button>
          <button
            type="button"
            onClick={handleOrderNow}
            className="bg-red-600 active:bg-red-700 text-white text-[10px] font-bold py-1.5 px-2.5 rounded-full shadow-md flex items-center gap-1 active:scale-90 cursor-pointer"
            aria-label="Quick Order Now"
          >
            <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
            <span>Order</span>
          </button>
        </div>

        {/* Desktop Hover Quick Actions Bar */}
        <div className="hidden md:flex absolute bottom-3 inset-x-3 z-10 gap-1.5 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          {onQuickView && (
            <button
              type="button"
              onClick={handleQuickViewClick}
              className="bg-white/95 hover:bg-white text-zinc-900 p-2.5 rounded-xl shadow-md border border-zinc-200 transition-all flex items-center justify-center backdrop-blur-sm cursor-pointer active:scale-95 shrink-0"
              title="Quick View"
            >
              <Eye className="w-3.5 h-3.5 text-zinc-600" />
            </button>
          )}

          <button
            type="button"
            onClick={handleQuickAdd}
            className={`flex-1 text-xs font-bold py-2.5 px-2 rounded-xl shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 ${
              added
                ? "bg-emerald-600 text-white"
                : "bg-zinc-900 hover:bg-zinc-800 text-white"
            }`}
            title="Add to cart"
          >
            {added ? (
              <>
                <Check className="w-3 h-3" /> Added
              </>
            ) : (
              <>
                <ShoppingBag className="w-3 h-3 text-red-500" /> Cart
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleOrderNow}
            className="flex-1 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold py-2.5 px-2 rounded-xl shadow-md shadow-red-600/30 transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
            title="Quick Order Now"
          >
            <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
            <span>Order Now</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Subcategory */}
          <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1">
            <span className="font-semibold text-zinc-600 uppercase tracking-wider">{product.brand}</span>
            <span>{product.subcategory}</span>
          </div>

          {/* Product Name */}
          <Link
            href={`/product/${product.slug}`}
            className="font-bold text-sm text-zinc-900 hover:text-red-600 transition-colors line-clamp-2 leading-snug"
          >
            {product.name}
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex items-center text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            </div>
            <span className="text-xs font-bold text-zinc-800">{product.rating}</span>
            <span className="text-[11px] text-zinc-400 font-medium">({product.reviewCount})</span>
          </div>
        </div>

        {/* Price & Variant Chips */}
        <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-base sm:text-lg font-black text-zinc-950 font-mono tabular-nums">
              ৳{Number(product.price || 0).toLocaleString("en-BD")}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-xs text-zinc-400 line-through font-mono tabular-nums">
                ৳{Number(product.compareAtPrice || 0).toLocaleString("en-BD")}
              </span>
            )}
          </div>

          {/* Variant Color preview dots */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center -space-x-1">
              {product.colors.slice(0, 3).map((col, idx) => (
                <span
                  key={idx}
                  className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs"
                  style={{ backgroundColor: col.hex }}
                  title={col.name}
                />
              ))}
              {product.colors.length > 3 && (
                <span className="text-[10px] text-zinc-500 pl-1.5">
                  +{product.colors.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
