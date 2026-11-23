"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star,
  ShoppingBag,
  Heart,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  ChevronRight,
  Share2,
  Wrench,
  CheckCircle2,
  Sparkles,
  Camera,
  Zap,
  Copy,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import { Product, ProductVariant } from "@/types";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useToast } from "@/context/ToastContext";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductReview } from "@/types";

interface ProductDetailViewProps {
  product: Product;
  relatedProducts: Product[];
}

export function ProductDetailView({ product, relatedProducts }: ProductDetailViewProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();

  const displayColors = useMemo(() => {
    if (product.colors && product.colors.length > 0) return product.colors;
    return [
      { name: "Matte Black", hex: "#18181b" },
      { name: "Racing Red", hex: "#dc2626" },
      { name: "Gloss White", hex: "#ffffff" },
      { name: "Titanium Silver", hex: "#64748b" },
    ];
  }, [product.colors]);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes?.[0] || "");
  const [selectedColor, setSelectedColor] = useState<string>(
    product.colors?.[0]?.name || "Matte Black"
  );
  const [selectedMaterial, setSelectedMaterial] = useState<string>(product.materials?.[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"specs" | "shipping" | "warranty" | "reviews">("specs");

  // Interactive Lens Zoom State
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomCoords, setZoomCoords] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - left) / width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - top) / height) * 100));
    setZoomCoords({ x, y });
  };

  // Sync state whenever viewing product changes
  useEffect(() => {
    setSelectedImage(0);
    setSelectedSize(product.sizes?.[0] || "");
    setSelectedColor(product.colors?.[0]?.name || "");
    setSelectedMaterial(product.materials?.[0] || "");
    setQuantity(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [product.id, product.sizes, product.colors, product.materials]);

  // Reviews state for writing a new review
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImage, setReviewImage] = useState<string | null>(null);
  const [reviewsList, setReviewsList] = useState<ProductReview[]>([]);

  useEffect(() => {
    fetch(`/api/products/${product.slug}/reviews`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.success && Array.isArray(json.data?.reviews)) {
          setReviewsList(json.data.reviews);
        }
      })
      .catch(() => {});
  }, [product.slug]);

  // Social Share Modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Lock scroll when review modal is open
  useEffect(() => {
    if (isReviewModalOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setIsReviewModalOpen(false);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isReviewModalOpen]);

  const isWishlisted = isInWishlist(product.id);

  // Check if a specific variant matches
  const matchedVariant: ProductVariant | undefined = product.variants?.find(
    (v) =>
      (!selectedColor || v.color === selectedColor) &&
      (!selectedSize || v.size === selectedSize)
  );

  const currentPrice = matchedVariant?.price ?? product.price;
  const currentComparePrice = matchedVariant?.compareAtPrice ?? product.compareAtPrice;
  const currentStock = matchedVariant?.stock ?? product.stock;
  const currentSKU = matchedVariant?.sku ?? product.sku;

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedSize, selectedColor, selectedMaterial, matchedVariant);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity, selectedSize, selectedColor, selectedMaterial, matchedVariant);
    router.push("/checkout");
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewComment.trim()) {
      showToast("Incomplete Review", "Please enter your name and comments.", "error");
      return;
    }

    const newRev = {
      id: Date.now().toString(),
      userName: reviewName.trim(),
      userCity: "Dhaka, Bangladesh",
      rating: reviewRating,
      date: "Just now",
      title: "Verified Customer Review",
      comment: reviewComment.trim(),
      verifiedPurchase: true,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
      image: reviewImage || undefined,
      status: "pending" as const,
    };

    setReviewsList((prev) => [newRev, ...prev]);
    showToast(
      "Review Submitted for Approval",
      "Thank you! Your review and photo have been received and are pending admin moderation.",
      "success"
    );
    setIsReviewModalOpen(false);
    setReviewName("");
    setReviewComment("");
    setReviewImage(null);

    try {
      await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          rating: reviewRating,
          title: "Verified Customer Review",
          comment: newRev.comment,
          images: newRev.image ? [newRev.image] : [],
        }),
      });
    } catch {
      // Local state is already updated
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumb Header */}
      <div className="border-b border-zinc-200 bg-zinc-50/60 py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-zinc-500">
          <nav className="flex items-center gap-1.5 flex-wrap">
            <Link href="/" className="hover:text-zinc-900 transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            <Link href="/shop" className="hover:text-zinc-900 transition-colors">
              Catalog
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            <Link
              href={`/category/${product.categorySlug}`}
              className="hover:text-zinc-900 transition-colors"
            >
              {product.category}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-semibold text-zinc-900 truncate max-w-[200px] sm:max-w-xs">
              {product.name}
            </span>
          </nav>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-950 font-medium"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </div>

      {/* Main Product Showcase Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          {/* Left: Product Image Gallery */}
          <div className="lg:col-span-7 space-y-4">
            {/* Large Active Image with Interactive Lens Magnifier */}
            <div
              className="relative aspect-square w-full rounded-3xl overflow-hidden bg-zinc-50 border border-zinc-200 shadow-sm group cursor-crosshair select-none"
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
            >
              <div
                className="relative w-full h-full transition-transform duration-150 ease-out will-change-transform"
                style={{
                  transformOrigin: `${zoomCoords.x}% ${zoomCoords.y}%`,
                  transform: isZoomed ? "scale(2.2)" : "scale(1)",
                }}
              >
                <Image
                  src={product.images?.[selectedImage] || product.images?.[0] || "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=600&auto=format&fit=crop"}
                  alt={product.name}
                  fill
                  priority
                  className="object-cover pointer-events-none"
                  sizes="(max-width: 1024px) 100vw, 55vw"
                />
              </div>

              {/* Discount / Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 pointer-events-none">
                {product.discountPercentage && (
                  <span className="bg-red-600 text-white font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                    -{product.discountPercentage}% OFF
                  </span>
                )}
                {product.isNewArrival && (
                  <span className="bg-zinc-900 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    2026 Season
                  </span>
                )}
              </div>

              {/* Importer Authenticity Badge */}
              <div className="absolute bottom-4 left-4 z-10 bg-zinc-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-800 text-[11px] text-zinc-200 flex items-center gap-1.5 pointer-events-none">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% Genuine Importer Hologram</span>
              </div>

              {/* Hover Zoom Prompt Badge */}
              <div
                className={`absolute top-4 right-4 z-10 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full pointer-events-none transition-opacity duration-300 flex items-center gap-1.5 ${
                  isZoomed ? "opacity-0" : "opacity-90 group-hover:opacity-100"
                }`}
              >
                <Sparkles className="w-3 h-3 text-red-400" />
                <span>Hover to Zoom Lens</span>
              </div>
            </div>

            {/* Thumbnail Navigation Row */}
            {(product.images?.length || 0) > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {(product.images || []).map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative w-24 h-24 rounded-2xl overflow-hidden border-2 bg-zinc-50 shrink-0 transition-all ${
                      selectedImage === idx
                        ? "border-red-600 ring-4 ring-red-600/10 shadow-sm"
                        : "border-zinc-200 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image src={img} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Details & Purchase Form */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div>
              {/* Brand, Product Type, and SKU */}
              <div className="flex items-center justify-between text-xs mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-red-600 tracking-wider uppercase">
                    {product.brand}
                  </span>
                  {product.productType && (
                    <span className="bg-zinc-100 text-zinc-700 font-bold text-[11px] px-2.5 py-0.5 rounded-full border border-zinc-200 uppercase tracking-wide">
                      {product.productType}
                    </span>
                  )}
                </div>
                <span className="font-mono text-zinc-400">SKU: {currentSKU}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight leading-snug">
                {product.name}
              </h1>

              <p className="text-xs text-zinc-500 font-medium mt-1 italic">
                {product.tagline}
              </p>

              {/* Rating & Stock */}
              <div className="flex items-center justify-between gap-4 mt-4 pb-4 border-b border-zinc-200">
                <div className="flex items-center gap-2">
                  <div className="flex text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating)
                            ? "fill-amber-400 text-amber-400"
                            : "fill-zinc-200 text-zinc-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-zinc-900">{product.rating}</span>
                  <a
                    href="#reviews-section"
                    onClick={() => setActiveTab("reviews")}
                    className="text-xs text-zinc-500 hover:text-red-600 underline font-medium"
                  >
                    ({product.reviewCount} customer reviews)
                  </a>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <Check className="w-3.5 h-3.5" />
                  <span>In Stock ({currentStock} available)</span>
                </div>
              </div>

              {/* Pricing Display */}
              <div className="mt-5 flex flex-wrap items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight">
                  ৳{Number(currentPrice || 0).toLocaleString("en-BD")}
                </span>
                {currentComparePrice && currentComparePrice > currentPrice ? (
                  <>
                    <span className="text-base sm:text-lg text-zinc-400 line-through font-semibold">
                      ৳{Number(currentComparePrice || 0).toLocaleString("en-BD")}
                    </span>
                    <span className="text-xs font-black text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                      <span>Save ৳{Number((currentComparePrice || 0) - (currentPrice || 0)).toLocaleString("en-BD")}</span>
                      <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">
                        {Math.round(((currentComparePrice - currentPrice) / currentComparePrice) * 100)}% OFF
                      </span>
                    </span>
                  </>
                ) : null}
              </div>

              {/* Brief Description */}
              <p className="mt-4 text-xs sm:text-sm text-zinc-600 leading-relaxed">
                {product.description}
              </p>

              {/* Color Selector */}
              {displayColors && displayColors.length > 0 && (
                <div className="mt-6">
                  <div className="flex justify-between items-center text-xs font-semibold text-zinc-900 mb-2.5">
                    <span>
                      Available Finish / Color:{" "}
                      <strong className="text-red-600 font-bold ml-1">{selectedColor}</strong>
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {displayColors.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setSelectedColor(c.name)}
                        className={`group flex items-center gap-2 py-1.5 px-3 rounded-xl border transition-all ${
                          selectedColor === c.name
                            ? "border-red-600 bg-red-50 text-red-950 font-bold shadow-xs ring-1 ring-red-600/30"
                            : "border-zinc-200 bg-white hover:border-zinc-400 text-zinc-700 font-medium"
                        }`}
                        title={c.name}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-black/20 shadow-2xs flex items-center justify-center shrink-0"
                          style={{ backgroundColor: c.hex }}
                        >
                          {selectedColor === c.name && (
                            <Check
                              className={`w-2.5 h-2.5 ${
                                c.hex.toLowerCase() === "#ffffff" || c.name.toLowerCase().includes("white")
                                  ? "text-zinc-900"
                                  : "text-white"
                              }`}
                            />
                          )}
                        </span>
                        <span className="text-xs">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selector */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="mt-5">
                  <div className="flex justify-between items-center text-xs font-semibold text-zinc-900 mb-2">
                    <span>Option / Size: <strong className="text-zinc-950 font-bold">{selectedSize}</strong></span>
                    <button
                      onClick={() =>
                        showToast(
                          "Fitment Guide",
                          "Helmets & Jackets are standard European sizing. Free size exchange within 7 days in Bangladesh.",
                          "info"
                        )
                      }
                      className="text-xs text-red-600 hover:underline font-medium"
                    >
                      Size & Fit Guide
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedSize(s)}
                        className={`text-xs px-3.5 py-2 rounded-xl border font-bold transition-all ${
                          selectedSize === s
                            ? "bg-zinc-950 text-white border-zinc-950 shadow-sm"
                            : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Material Selector if multiple */}
              {product.materials && product.materials.length > 1 && (
                <div className="mt-5">
                  <span className="text-xs font-semibold text-zinc-900 block mb-2">
                    Material Specification:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {product.materials.map((m) => (
                      <button
                        key={m}
                        onClick={() => setSelectedMaterial(m)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                          selectedMaterial === m
                            ? "bg-zinc-900 text-white border-zinc-900"
                            : "bg-white text-zinc-700 border-zinc-200"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="mt-6 flex items-center gap-4">
                <span className="text-xs font-bold text-zinc-900">Quantity:</span>
                <div className="flex items-center border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-xs">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3.5 py-2 text-zinc-600 hover:bg-zinc-100 font-black text-sm"
                  >
                    -
                  </button>
                  <span className="px-3.5 py-2 text-xs font-black text-zinc-950 min-w-10 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                    className="px-3.5 py-2 text-zinc-600 hover:bg-zinc-100 font-black text-sm"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-zinc-500">
                  Subtotal: <strong className="text-zinc-950">৳{Number((currentPrice || 0) * quantity).toLocaleString("en-BD")}</strong>
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-6 border-t border-zinc-200">
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-zinc-950 hover:bg-zinc-800 active:bg-black text-white font-bold text-sm py-4 px-6 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4 text-red-500" />
                  <span>Add to Cart</span>
                </button>

                <button
                  onClick={() => toggleWishlist(product)}
                  className={`p-4 rounded-2xl border transition-all ${
                    isWishlisted
                      ? "bg-red-50 border-red-200 text-red-600 shadow-sm"
                      : "border-zinc-200 text-zinc-700 hover:border-zinc-400 bg-white"
                  }`}
                  title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? "fill-red-600" : ""}`} />
                </button>
              </div>

              {/* Quick Order Now Button */}
              <button
                onClick={handleBuyNow}
                className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-extrabold text-sm py-4 px-6 rounded-2xl shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 group cursor-pointer active:scale-97 animate-shimmer-ray"
              >
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300 group-hover:scale-110 transition-transform" />
                <span>Quick Order Now (Direct Checkout)</span>
              </button>

              {/* Trust Badges Minimal */}
              <div className="grid grid-cols-2 gap-3 pt-4 text-xs text-zinc-600">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-50 border border-zinc-100">
                  <Truck className="w-4 h-4 text-red-600 shrink-0" />
                  <span>24-48h Delivery in Dhaka</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-50 border border-zinc-100">
                  <RotateCcw className="w-4 h-4 text-red-600 shrink-0" />
                  <span>7-Day Free Size Exchange</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Tabs Section */}
        <div id="reviews-section" className="mt-16 pt-10 border-t border-zinc-200">
          <div className="flex items-center gap-2 border-b border-zinc-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab("specs")}
              className={`pb-4 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
                activeTab === "specs"
                  ? "border-red-600 text-zinc-950"
                  : "border-transparent text-zinc-500 hover:text-zinc-800"
              }`}
            >
              Specifications & Features
            </button>
            <button
              onClick={() => setActiveTab("shipping")}
              className={`pb-4 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
                activeTab === "shipping"
                  ? "border-red-600 text-zinc-950"
                  : "border-transparent text-zinc-500 hover:text-zinc-800"
              }`}
            >
              Bangladesh Courier Logistics
            </button>
            <button
              onClick={() => setActiveTab("warranty")}
              className={`pb-4 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
                activeTab === "warranty"
                  ? "border-red-600 text-zinc-950"
                  : "border-transparent text-zinc-500 hover:text-zinc-800"
              }`}
            >
              Importer Warranty & Authenticity
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`pb-4 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
                activeTab === "reviews"
                  ? "border-red-600 text-zinc-950"
                  : "border-transparent text-zinc-500 hover:text-zinc-800"
              }`}
            >
              Customer Reviews ({reviewsList.length})
            </button>
          </div>

          {/* Tab Content */}
          <div className="py-8">
            {activeTab === "specs" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 uppercase tracking-wider mb-4">
                    Key Engineering Features
                  </h3>
                  <ul className="space-y-3">
                    {product.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-700">
                        <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-zinc-900 uppercase tracking-wider mb-4">
                    Technical Specifications
                  </h3>
                  <div className="border border-zinc-200 rounded-2xl overflow-hidden divide-y divide-zinc-200 text-xs">
                    {Object.entries(product.specifications).map(([key, val]) => (
                      <div key={key} className="grid grid-cols-2 p-3 bg-white even:bg-zinc-50">
                        <span className="font-semibold text-zinc-600">{key}</span>
                        <span className="font-bold text-zinc-900">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "shipping" && (
              <div className="max-w-3xl space-y-6 text-xs text-zinc-700 leading-relaxed">
                <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
                  <h4 className="font-bold text-sm text-zinc-900">
                    Doorstep Courier Delivery Across Bangladesh
                  </h4>
                  <p>
                    All Motoplex BD orders are packaged in sealed tamper-proof packaging. We partner with Pathao Express and Steadfast Courier to reach every district and thana across Bangladesh.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="p-3 bg-white rounded-xl border border-zinc-200">
                      <strong className="text-zinc-950 block">Inside Dhaka City</strong>
                      <span className="text-zinc-500">24 to 48 Hours Delivery • Standard Fee ৳80</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-zinc-200">
                      <strong className="text-zinc-950 block">All 63 Districts Outside Dhaka</strong>
                      <span className="text-zinc-500">2 to 4 Business Days • Standard Fee ৳150</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-emerald-700 font-semibold pt-1">
                    * Orders above ৳5,000 qualify for 100% Free Express Delivery!
                  </p>
                </div>
              </div>
            )}

            {activeTab === "warranty" && (
              <div className="max-w-3xl space-y-4 text-xs text-zinc-700 leading-relaxed">
                <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
                  <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
                    <Wrench className="w-4 h-4" />
                    <span>Official Motoplex Bangladesh Showroom Warranty</span>
                  </div>
                  <p>
                    Every motorcycle and accessory imported by Motoplex BD carries our registered barcode and verifiable warranty card.
                  </p>
                  <ul className="space-y-1.5 list-disc pl-5">
                    <li>Motorcycles (Aprilia & Vespa): 2-Year Engine & Electrical Warranty with 4 free routine maintenance services at our Gulshan-2 facility.</li>
                    <li>Shoei Helmets: 5-Year International Manufacturer Warranty against shell or liner defects.</li>
                    <li>Riding Gear & Jackets: 1-Year stitching and zipper warranty.</li>
                    <li>7-Day Size Exchange: If your jacket or helmet fit is slightly off, we exchange it for your exact size with zero restocking charges.</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-8">
                {/* Header & Write Review Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-zinc-50 rounded-2xl border border-zinc-200">
                  <div>
                    <h3 className="text-base font-bold text-zinc-900">
                      Customer Reviews & Feedback
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="text-xs font-black text-zinc-900">
                        {product.rating} out of 5.0
                      </span>
                      <span className="text-xs text-zinc-500">
                        ({reviewsList.length} reviews)
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsReviewModalOpen(true)}
                    className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs px-5 py-3 rounded-xl transition-colors shadow-xs"
                  >
                    Write a Review
                  </button>
                </div>

                {/* Reviews List */}
                {reviewsList.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {reviewsList.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-xs space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-200 shrink-0">
                              <Image src={rev.avatar || ""} alt="" fill className="object-cover" />
                            </div>
                            <div>
                              <h4 className="font-bold text-xs text-zinc-900 flex items-center gap-1.5">
                                {rev.userName}
                                {rev.verifiedPurchase && (
                                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                    Verified Rider
                                  </span>
                                )}
                              </h4>
                              <p className="text-[10px] text-zinc-400">{rev.userCity} • {rev.date}</p>
                            </div>
                          </div>

                          <div className="flex text-amber-500">
                            {[...Array(rev.rating)].map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                        </div>

                        <h5 className="font-bold text-xs text-zinc-900 flex items-center gap-2">
                          <span>{rev.title}</span>
                          {rev.status === "pending" && (
                            <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              Under Moderation
                            </span>
                          )}
                        </h5>
                        <p className="text-xs text-zinc-600 leading-relaxed">{rev.comment}</p>

                        {/* Attached Customer Review Image */}
                        {rev.image && (
                          <div className="pt-2">
                            <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50 shadow-xs">
                              <Image src={rev.image} alt="Customer product photo" fill className="object-cover" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-10 text-center bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-3">
                    <Star className="w-8 h-8 text-zinc-300 mx-auto" />
                    <p className="text-sm font-bold text-zinc-800">No customer reviews yet</p>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                      Purchased this item? Be the first rider to share verified feedback with the Motoplex community.
                    </p>
                    <button
                      onClick={() => setIsReviewModalOpen(true)}
                      className="inline-block mt-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors shadow-xs"
                    >
                      Write First Review
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Products Carousel / Grid */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-12 border-t border-zinc-200">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-xs font-bold text-red-600 uppercase tracking-widest">
                  Complement Your Ride
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-zinc-950 mt-1 tracking-tight">
                  RELATED PRODUCTS
                </h2>
              </div>
              <Link
                href={`/category/${product.categorySlug}`}
                className="text-xs font-bold text-zinc-900 hover:text-red-600"
              >
                View Category →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Write Review Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-zinc-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="font-bold text-sm text-zinc-950">Write a Product Review</h3>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-900 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-zinc-900 block mb-1">Your Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Shakib Al Hasan"
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-900 block mb-1">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= reviewRating
                            ? "fill-amber-400 text-amber-400"
                            : "fill-zinc-200 text-zinc-200"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-900 block mb-1">Your Review</label>
                <textarea
                  rows={4}
                  placeholder="How was the build quality, sizing, and comfort on the road?"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-600"
                />
              </div>

              {/* Photo Upload Attachment */}
              <div>
                <label className="font-bold text-zinc-900 block mb-1">
                  Attach Product Photo (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    id="review-image-input"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => setReviewImage(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <label
                    htmlFor="review-image-input"
                    className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-xs font-semibold text-zinc-700 transition-colors"
                  >
                    <Camera className="w-4 h-4 text-zinc-500" />
                    <span>{reviewImage ? "Change Photo" : "Upload Photo"}</span>
                  </label>
                  {reviewImage && (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-zinc-200">
                      <Image src={reviewImage} alt="Review attachment" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => setReviewImage(null)}
                        className="absolute top-0 right-0 bg-black/70 text-white rounded-bl p-0.5 text-[10px]"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Moderation notice */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-[11px] text-amber-900 leading-snug">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Submitted customer reviews with photos are moderated before public display to guarantee genuine rider feedback.</span>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold py-2.5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl transition-colors"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Social Share Modal */}
      {isShareModalOpen && (
        <div
          onClick={() => setIsShareModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-zinc-200 p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="font-bold text-sm text-zinc-950 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-red-600" />
                <span>Share This Product</span>
              </h3>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-900 p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-500">
              Share <strong>{product.name}</strong> with fellow riders:
            </p>

            <div className="space-y-2 text-xs">
              {/* WhatsApp Share */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `${product.name} (৳${Number(product.price || 0).toLocaleString("en-BD")}) - Check this on Motoplex BD: ${
                    typeof window !== "undefined" ? window.location.href : ""
                  }`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsShareModalOpen(false)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Share on WhatsApp</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
              </a>

              {/* Facebook Share */}
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                  typeof window !== "undefined" ? window.location.href : ""
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsShareModalOpen(false)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-bold transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <ExternalLink className="w-4 h-4 text-blue-600" />
                  <span>Share on Facebook</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
              </a>

              {/* Copy Direct Link */}
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    navigator.clipboard.writeText(window.location.href);
                    showToast("Link Copied!", "Product URL copied to clipboard.", "success");
                    setIsShareModalOpen(false);
                  }
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border border-zinc-200 font-bold transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Copy className="w-4 h-4 text-zinc-600" />
                  <span>Copy Product Link</span>
                </div>
                <span className="text-[10px] text-zinc-400 font-medium">Click to Copy</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Mobile Floating Sticky Action Bar (Docked right above bottom navigation) */}
      <div className="md:hidden fixed bottom-[52px] inset-x-0 z-35 bg-white/95 backdrop-blur-md border-t border-zinc-200/90 px-4 py-2.5 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-200">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-zinc-900 truncate">{product.name}</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs font-black text-red-600 font-mono tabular-nums">
              ৳{Number(product.price || 0).toLocaleString("en-BD")}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-[10px] text-zinc-400 line-through font-mono">
                ৳{Number(product.compareAtPrice || 0).toLocaleString("en-BD")}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleAddToCart}
            className="p-2.5 rounded-xl bg-zinc-900 active:bg-zinc-800 text-white shadow-md active:scale-90 transition-transform"
            aria-label="Add to cart"
            title="Add to cart"
          >
            <ShoppingBag className="w-4 h-4 text-red-500" />
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            className="bg-red-600 active:bg-red-700 text-white text-xs font-black py-2.5 px-4 rounded-xl shadow-md shadow-red-600/30 flex items-center gap-1.5 active:scale-95 transition-all animate-shimmer-ray cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span>Order Now</span>
          </button>
        </div>
      </div>
    </div>
  );
}
