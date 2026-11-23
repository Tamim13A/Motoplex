import React from "react";

export default function StoreLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-150">
      {/* Top Banner Skeleton */}
      <div className="skeleton-wave rounded-3xl h-44 sm:h-56 w-full border border-zinc-200/60" />

      {/* Title & Filter Bar Skeleton */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
        <div className="skeleton-wave rounded-xl h-7 w-48" />
        <div className="skeleton-wave rounded-xl h-9 w-32" />
      </div>

      {/* Grid of Product Skeletons (CLS = 0.00) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-zinc-200/80 p-3 sm:p-4 space-y-3 shadow-xs"
          >
            {/* Aspect Square Image Placeholder */}
            <div className="skeleton-wave aspect-square w-full rounded-xl" />

            {/* Subtitle & Brand Placeholder */}
            <div className="flex justify-between items-center">
              <div className="skeleton-wave h-3 w-16 rounded" />
              <div className="skeleton-wave h-3 w-12 rounded" />
            </div>

            {/* Product Title Placeholder */}
            <div className="skeleton-wave h-4 w-5/6 rounded" />
            <div className="skeleton-wave h-4 w-3/5 rounded" />

            {/* Price & Action Placeholder */}
            <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
              <div className="skeleton-wave h-5 w-20 rounded" />
              <div className="skeleton-wave h-7 w-16 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

