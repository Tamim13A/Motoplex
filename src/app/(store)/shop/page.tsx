"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  SlidersHorizontal,
  ChevronRight,
  Search,
  X,
  RotateCcw,
} from "lucide-react";
import { categories } from "@/data/categories";
import { products as initialProducts } from "@/data/products";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductFilters, FilterValues } from "@/components/shop/ProductFilters";
import { QuickViewModal } from "@/components/ui/QuickViewModal";
import { Product } from "@/types";
import { formatProduct } from "@/lib/productFormatter";

function ShopContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "";
  const initialSubcategory = searchParams.get("subcategory") || "";
  const initialBrand = searchParams.get("brand") || "";
  const initialQuery = searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [sortBy, setSortBy] = useState<string>("featured");
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const defaultFilters: FilterValues = {
    category: initialCategory,
    subcategory: initialSubcategory,
    minPrice: 0,
    maxPrice: 1050000,
    selectedBrands: initialBrand ? initialBrand.split(",").map((b) => b.trim()).filter(Boolean) : [],
    selectedSizes: [],
    selectedColors: [],
    selectedMaterials: [],
    inStockOnly: false,
    minRating: 0,
  };

  const [filters, setFilters] = useState<FilterValues>(defaultFilters);
  const [allProducts, setAllProducts] = useState<Product[]>(() => {
    return initialProducts.map(formatProduct);
  });

  // Fetch live products from database
  useEffect(() => {
    fetch("/api/products?limit=500", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.success && Array.isArray(json.data?.products) && json.data.products.length > 0) {
          setAllProducts(json.data.products.map(formatProduct));
        }
      })
      .catch(() => {});
  }, []);

  // Sync with searchParams if URL changes
  useEffect(() => {
    const cat = searchParams.get("category") || "";
    const sub = searchParams.get("subcategory") || "";
    const b = searchParams.get("brand") || "";
    const q = searchParams.get("q") || "";
    if (cat || sub || b) {
      setFilters((prev) => ({
        ...prev,
        category: cat,
        subcategory: sub,
        selectedBrands: b ? b.split(",").map((x) => x.trim()).filter(Boolean) : prev.selectedBrands,
      }));
      setCurrentPage(1);
    }
    if (q) {
      setSearchQuery(q);
      setCurrentPage(1);
    }
  }, [searchParams]);

  // Lock scroll when mobile filter is open
  useEffect(() => {
    if (isMobileFilterOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setIsMobileFilterOpen(false);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isMobileFilterOpen]);

  // Active category details
  const activeCategoryObj = useMemo(() => {
    return categories.find((c) => c.slug === filters.category);
  }, [filters.category]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.subcategory.toLowerCase().includes(q)
      );
    }

    // Category
    if (filters.category) {
      const targetCat = filters.category.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.categorySlug?.toLowerCase() === targetCat ||
          p.category?.toLowerCase() === targetCat ||
          p.subcategorySlug?.toLowerCase() === targetCat ||
          p.subcategory?.toLowerCase() === targetCat
      );
    }

    // Subcategory
    if (filters.subcategory) {
      const targetSub = filters.subcategory.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.subcategorySlug?.toLowerCase() === targetSub ||
          p.subcategory?.toLowerCase() === targetSub
      );
    }

    // Brands
    if (filters.selectedBrands && filters.selectedBrands.length > 0) {
      result = result.filter((p) =>
        filters.selectedBrands.some((b) =>
          p.brand.toLowerCase().includes(b.toLowerCase())
        )
      );
    }

    // Price
    result = result.filter(
      (p) => p.price >= filters.minPrice && p.price <= filters.maxPrice
    );

    // Sizes
    if (filters.selectedSizes.length > 0) {
      result = result.filter((p) =>
        p.sizes?.some((s) =>
          filters.selectedSizes.some((selected) =>
            s.toLowerCase().includes(selected.toLowerCase())
          )
        )
      );
    }

    // Colors
    if (filters.selectedColors.length > 0) {
      result = result.filter((p) =>
        p.colors?.some((c) =>
          filters.selectedColors.some((selected) =>
            c.name.toLowerCase().includes(selected.toLowerCase())
          )
        )
      );
    }

    // Materials
    if (filters.selectedMaterials.length > 0) {
      result = result.filter((p) =>
        p.materials?.some((m) =>
          filters.selectedMaterials.some((selected) =>
            m.toLowerCase().includes(selected.toLowerCase())
          )
        )
      );
    }

    // Stock
    if (filters.inStockOnly) {
      result = result.filter((p) => p.stock > 0);
    }

    // Rating
    if (filters.minRating > 0) {
      result = result.filter((p) => p.rating >= filters.minRating);
    }

    // Sort
    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        result.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
        break;
      case "featured":
      default:
        result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
        break;
    }

    return result;
  }, [filters, searchQuery, sortBy]);

  // Pagination (8 items per page)
  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;

  // Auto-clamp page if filters change and reduce total page count
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  // Real REST API integration with resilient fallback
  const [apiProducts, setApiProducts] = useState<Product[] | null>(null);
  const [apiTotalPages, setApiTotalPages] = useState<number | null>(null);
  const [apiTotalCount, setApiTotalCount] = useState<number | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    const fetchCatalog = async () => {
      setIsFetching(true);
      try {
        const params = new URLSearchParams();
        if (filters.category) params.set("category", filters.category);
        if (filters.subcategory) params.set("subcategory", filters.subcategory);
        if (searchQuery.trim()) params.set("q", searchQuery.trim());
        if (filters.minPrice > 0) params.set("minPrice", filters.minPrice.toString());
        if (filters.maxPrice < 1050000) params.set("maxPrice", filters.maxPrice.toString());
        if (filters.selectedBrands && filters.selectedBrands.length > 0) {
          params.set("brands", filters.selectedBrands.join(","));
        }
        if (filters.selectedSizes.length > 0) params.set("sizes", filters.selectedSizes.join(","));
        if (filters.selectedColors.length > 0) params.set("colors", filters.selectedColors.join(","));
        if (filters.selectedMaterials.length > 0) params.set("materials", filters.selectedMaterials.join(","));
        if (filters.inStockOnly) params.set("inStockOnly", "true");
        if (filters.minRating > 0) params.set("rating", filters.minRating.toString());
        if (sortBy) params.set("sortBy", sortBy);
        params.set("page", currentPage.toString());
        params.set("limit", itemsPerPage.toString());

        const res = await fetch(`/api/products?${params.toString()}`, { cache: "no-store" });
        if (!res.ok) throw new Error("API Offline");
        const json = await res.json();
        if (json.success && Array.isArray(json.data?.products) && json.data.products.length > 0) {
          if (!isCancelled) {
            const mapped: Product[] = json.data.products.map((p: any) => ({
              id: p._id?.toString() || p.id,
              name: p.name,
              slug: p.slug,
              tagline: p.tagline || "",
              brand: p.brand || "",
              category: p.category || p.categorySlug || "",
              categorySlug: p.categorySlug || "",
              subcategory: p.subcategory || p.subcategorySlug || "",
              subcategorySlug: p.subcategorySlug || "",
              price: p.price,
              compareAtPrice: p.compareAtPrice,
              discountPercentage: p.discountPercentage,
              rating: p.rating || 5,
              reviewCount: p.reviewCount || 0,
              sku: p.sku || "",
              stock: p.stock ?? 10,
              images: p.images || [],
              description: p.description || "",
              features: p.features || [],
              specifications: p.specifications || {},
              variants: p.variants || [],
              sizes: p.sizes || p.variants?.map((v: any) => v.size).filter(Boolean) || [],
              colors: p.colors || p.variants?.map((v: any) => ({ name: v.color || "", hex: v.colorHex || "#000000" })).filter((c: any) => c.name) || [],
              materials: p.materials || p.variants?.map((v: any) => v.material).filter(Boolean) || [],
              isFeatured: p.isFeatured,
              isBestSeller: p.isBestSeller,
              isNewArrival: p.isNewArrival,
            }));
            setApiProducts(mapped);
            setApiTotalPages(json.data.pagination.totalPages || 1);
            setApiTotalCount(json.data.pagination.total || mapped.length);
          }
        } else {
          if (!isCancelled) {
            setApiProducts(null);
            setApiTotalPages(null);
            setApiTotalCount(null);
          }
        }
      } catch {
        if (!isCancelled) {
          setApiProducts(null);
          setApiTotalPages(null);
          setApiTotalCount(null);
        }
      } finally {
        if (!isCancelled) setIsFetching(false);
      }
    };

    const timer = setTimeout(fetchCatalog, 250);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [filters, searchQuery, sortBy, currentPage, itemsPerPage]);

  const finalProducts = apiProducts !== null ? apiProducts : paginatedProducts;
  const finalTotalPages = apiTotalPages !== null ? apiTotalPages : totalPages;
  const finalTotalCount = apiTotalCount !== null ? apiTotalCount : filteredProducts.length;

  const handleResetFilters = () => {
    setFilters({
      category: "",
      subcategory: "",
      minPrice: 0,
      maxPrice: 1050000,
      selectedBrands: [],
      selectedSizes: [],
      selectedColors: [],
      selectedMaterials: [],
      inStockOnly: false,
      minRating: 0,
    });
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Active filters count
  const activeFiltersCount =
    (filters.category ? 1 : 0) +
    (filters.subcategory ? 1 : 0) +
    (filters.selectedBrands?.length || 0) +
    (filters.maxPrice < 1050000 ? 1 : 0) +
    filters.selectedSizes.length +
    filters.selectedColors.length +
    filters.selectedMaterials.length +
    (filters.inStockOnly ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0);

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumb Header Bar */}
      <div className="border-b border-zinc-200 bg-zinc-50/60 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <nav className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
              <Link href="/" className="hover:text-zinc-900 transition-colors">
                Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
              <Link href="/shop" className="hover:text-zinc-900 transition-colors">
                Catalog
              </Link>
              {activeCategoryObj && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="font-semibold text-zinc-900">
                    {activeCategoryObj.name}
                  </span>
                </>
              )}
            </nav>

            <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
              {activeCategoryObj ? activeCategoryObj.name : "ALL MOTORCYCLES & RACING GEAR"}
            </h1>
            <p className="text-xs text-zinc-500 mt-1 max-w-xl">
              {activeCategoryObj
                ? activeCategoryObj.description
                : "Explore authentic Italian motorcycles, FIM homologated helmets, protective apparel, and racing exhausts with official Motoplex Bangladesh warranty."}
            </p>
          </div>

          {/* Search in Catalog */}
          <div className="w-full md:w-72 relative">
            <input
              type="text"
              placeholder="Search catalog products..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white border border-zinc-200 rounded-xl pl-9 pr-8 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-red-600 shadow-xs"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="p-1 text-zinc-400 hover:text-zinc-600 absolute right-2.5 top-2"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Layout Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Desktop Left Sidebar Filters */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-28 bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs">
              <ProductFilters
                filters={filters}
                onChange={(newFilters) => {
                  setFilters(newFilters);
                  setCurrentPage(1);
                }}
                onReset={handleResetFilters}
              />
            </div>
          </aside>

          {/* Right Product Grid Area */}
          <main className="lg:col-span-3 space-y-6">
            {/* Top Toolbar: Count, Mobile filter button & Sort */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-200">
              <div className="flex items-center gap-3">
                {/* Mobile Filter Button */}
                <button
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="lg:hidden flex items-center gap-2 bg-zinc-900 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors shadow-xs"
                >
                  <SlidersHorizontal className="w-4 h-4 text-red-500" />
                  <span>Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="bg-red-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                <p className="text-xs text-zinc-500 flex items-center gap-2">
                  <span>
                    Showing <strong className="text-zinc-900">{finalProducts.length}</strong> of{" "}
                    <strong className="text-zinc-900">{finalTotalCount}</strong> products
                  </span>
                  {isFetching && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                      Live Sync
                    </span>
                  )}
                </p>
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-zinc-500 font-medium">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-zinc-200 rounded-xl px-3 py-1.5 text-xs text-zinc-900 font-semibold focus:outline-none focus:ring-1 focus:ring-red-600 cursor-pointer shadow-xs"
                >
                  <option value="featured">Featured / Best Match</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Highest Customer Rating</option>
                  <option value="newest">Newest Season Arrivals</option>
                </select>
              </div>
            </div>

            {/* Active Filters Badges */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-semibold text-zinc-500">Active Filters:</span>

                {filters.selectedBrands?.map((brand) => (
                  <span
                    key={brand}
                    className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-full font-medium"
                  >
                    Brand: {brand}
                    <button
                      onClick={() =>
                        setFilters({
                          ...filters,
                          selectedBrands: (filters.selectedBrands || []).filter((b) => b !== brand),
                        })
                      }
                      className="hover:text-red-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {filters.category && (
                  <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-full font-medium">
                    Category: {categories.find((c) => c.slug === filters.category)?.name}
                    <button
                      onClick={() => setFilters({ ...filters, category: "", subcategory: "" })}
                      className="hover:text-red-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {filters.subcategory && (
                  <span className="inline-flex items-center gap-1 text-xs bg-zinc-100 text-zinc-800 border border-zinc-200 px-2.5 py-1 rounded-full font-medium">
                    Subcategory: {filters.subcategory}
                    <button
                      onClick={() => setFilters({ ...filters, subcategory: "" })}
                      className="hover:text-black"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {filters.maxPrice < 1050000 && (
                  <span className="inline-flex items-center gap-1 text-xs bg-zinc-100 text-zinc-800 border border-zinc-200 px-2.5 py-1 rounded-full font-medium">
                    Max: ৳{filters.maxPrice.toLocaleString()}
                    <button
                      onClick={() => setFilters({ ...filters, maxPrice: 1050000 })}
                      className="hover:text-black"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {filters.selectedSizes.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 text-xs bg-zinc-100 text-zinc-800 border border-zinc-200 px-2.5 py-1 rounded-full font-medium"
                  >
                    Size: {s}
                    <button
                      onClick={() =>
                        setFilters({
                          ...filters,
                          selectedSizes: filters.selectedSizes.filter((x) => x !== s),
                        })
                      }
                      className="hover:text-black"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {filters.selectedColors.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 text-xs bg-zinc-100 text-zinc-800 border border-zinc-200 px-2.5 py-1 rounded-full font-medium"
                  >
                    Color: {c}
                    <button
                      onClick={() =>
                        setFilters({
                          ...filters,
                          selectedColors: filters.selectedColors.filter((x) => x !== c),
                        })
                      }
                      className="hover:text-black"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                <button
                  onClick={handleResetFilters}
                  className="text-xs text-red-600 hover:underline font-semibold ml-2"
                >
                  Clear All
                </button>
              </div>
            )}

            {/* Products Grid */}
            {finalProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {finalProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onQuickView={(p) => setQuickViewProduct(p)}
                  />
                ))}
              </div>
            ) : (
              /* Empty state */
              <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-zinc-200 text-zinc-500 mx-auto flex items-center justify-center">
                  <Search className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 text-base">
                    No matching products found
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto leading-relaxed">
                    Try loosening your price filter, selecting different sizes, or searching with broader terms.
                  </p>
                </div>
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            )}

            {/* Pagination Controls */}
            {finalTotalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-8 border-t border-zinc-200">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3.5 py-2 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {[...Array(finalTotalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-9 h-9 text-xs font-bold rounded-xl transition-all ${
                        currentPage === pageNum
                          ? "bg-zinc-950 text-white shadow-sm"
                          : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(finalTotalPages, p + 1))}
                  disabled={currentPage === finalTotalPages}
                  className="px-3.5 py-2 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filters Slide-in Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden lg:hidden">
          <div
            onClick={() => setIsMobileFilterOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-sm bg-white shadow-2xl flex flex-col overflow-y-auto">
              <ProductFilters
                filters={filters}
                onChange={(newFilters) => {
                  setFilters(newFilters);
                  setCurrentPage(1);
                }}
                onReset={handleResetFilters}
                isMobileDrawer={true}
                onCloseMobileDrawer={() => setIsMobileFilterOpen(false)}
              />
              <div className="p-6 pt-0">
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-colors"
                >
                  Apply Filters ({finalTotalCount} Results)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-zinc-400">Loading catalog...</div>}>
      <ShopContent />
    </Suspense>
  );
}
