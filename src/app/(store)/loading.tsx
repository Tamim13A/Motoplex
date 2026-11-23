import React from "react";

export default function StoreLoading() {
  return (
    <div className="w-full fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="h-1 bg-red-600 animate-pulse w-full shadow-sm" />
    </div>
  );
}

