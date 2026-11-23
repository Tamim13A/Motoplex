"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Search, ArrowLeft, Camera, X, Trash2, Edit3, Save, Check } from "lucide-react";
import { products as initialProducts } from "@/data/products";
import { categories } from "@/data/categories";
import { useToast } from "@/context/ToastContext";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Product } from "@/types";

const AVAILABLE_COLORS = [
  { name: "Matte Black", hex: "#18181b" },
  { name: "Racing Red", hex: "#dc2626" },
  { name: "Gloss White", hex: "#ffffff" },
  { name: "Titanium Silver", hex: "#64748b" },
  { name: "Racing Blue", hex: "#2563eb" },
  { name: "Neon Green", hex: "#22c55e" },
  { name: "Amber Gold", hex: "#eab308" },
  { name: "Carbon Fiber", hex: "#27272a" },
];

export default function AdminProductsPage() {
  const { showToast } = useToast();
  const [productList, setProductList] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New product form
  const [newTitle, setNewTitle] = useState("");
  const [newBrand, setNewBrand] = useState("BIKERS");
  const [newProductType, setNewProductType] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newCategory, setNewCategory] = useState("Brake System");
  const [newImage, setNewImage] = useState("");

  // Full product edit modal state
  const [editingFullProduct, setEditingFullProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    brand: string;
    productType: string;
    price: string;
    compareAtPrice: string;
    stock: string;
    category: string;
    tagline: string;
    description: string;
    image: string;
    colors: { name: string; hex: string }[];
  }>({
    name: "",
    brand: "",
    productType: "",
    price: "",
    compareAtPrice: "",
    stock: "",
    category: "Brake System",
    tagline: "",
    description: "",
    image: "",
    colors: [],
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Edit image modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingImage, setEditingImage] = useState("");

  // Fetch live products on mount
  React.useEffect(() => {
    const fetchAdminProducts = async () => {
      try {
        const res = await fetch("/api/admin/products?limit=500");
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && Array.isArray(json.data?.products) && json.data.products.length > 0) {
          setProductList(
            json.data.products.map((p: Product & { _id?: string }) => ({
              ...p,
              id: p._id?.toString() || p.id,
            }))
          );
        }
      } catch {
        // Fallback to initialProducts
      }
    };
    fetchAdminProducts();
  }, []);

  const filtered = productList.filter((p) => {
    const matchCat =
      selectedCategory === "all" ||
      p.category === selectedCategory ||
      p.categorySlug === selectedCategory;
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!window.confirm(`Are you sure you want to remove "${productName}" from active inventory?`)) return;

    setProductList((prev) => prev.filter((p) => p.id !== productId));
    showToast("Product Removed", `"${productName}" removed from store catalog.`, "info");

    try {
      await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });
    } catch {
      // Local state updated
    }
  };

  const handleStockUpdate = async (productId: string, newStock: number) => {
    const clampedStock = Math.max(0, newStock);
    setProductList((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: clampedStock } : p))
    );
    showToast("Stock Adjusted", "Inventory levels updated.", "info");

    try {
      await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: clampedStock }),
      });
    } catch {
      // Local state already updated
    }
  };

  const handleOpenEditImage = (prod: Product) => {
    setEditingProduct(prod);
    setEditingImage(prod.images?.[0] || "");
  };

  const handleSaveProductImage = async () => {
    if (!editingProduct || !editingImage) return;

    setProductList((prev) =>
      prev.map((p) =>
        p.id === editingProduct.id
          ? { ...p, images: [editingImage, ...(p.images?.slice(1) || [])] }
          : p
      )
    );

    showToast("Image Updated", `Photo updated for ${editingProduct.name}.`, "success");
    setEditingProduct(null);

    try {
      await fetch(`/api/admin/products/${editingProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: [editingImage] }),
      });
    } catch {
      // Local state already updated
    }
  };

  const handleOpenEditFullProduct = (prod: Product) => {
    setEditingFullProduct(prod);
    const initialColors =
      prod.colors && prod.colors.length > 0
        ? prod.colors
        : [
            { name: "Matte Black", hex: "#18181b" },
            { name: "Racing Red", hex: "#dc2626" },
            { name: "Gloss White", hex: "#ffffff" },
            { name: "Titanium Silver", hex: "#64748b" },
          ];

    setEditForm({
      name: prod.name || "",
      brand: prod.brand || "",
      productType: prod.productType || "",
      price: String(prod.price || ""),
      compareAtPrice: String(prod.compareAtPrice || ""),
      stock: String(prod.stock || ""),
      category: prod.category || prod.categorySlug || "Brake System",
      tagline: prod.tagline || "",
      description: prod.description || "",
      image: prod.images?.[0] || "",
      colors: initialColors,
    });
  };

  const handleSaveFullProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFullProduct || !editForm.name.trim() || !editForm.price) return;

    setIsSubmittingEdit(true);
    const categorySlug = editForm.category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const updatedImages = editForm.image
      ? [editForm.image, ...(editingFullProduct.images?.slice(1) || [])]
      : editingFullProduct.images;

    const discountPercentage =
      editForm.compareAtPrice && Number(editForm.compareAtPrice) > Number(editForm.price)
        ? Math.round(((Number(editForm.compareAtPrice) - Number(editForm.price)) / Number(editForm.compareAtPrice)) * 100)
        : 0;

    const updatedProduct: Product = {
      ...editingFullProduct,
      name: editForm.name.trim(),
      brand: editForm.brand.trim() || editingFullProduct.brand,
      productType: editForm.productType.trim() || undefined,
      price: Number(editForm.price),
      compareAtPrice: editForm.compareAtPrice ? Number(editForm.compareAtPrice) : undefined,
      discountPercentage,
      stock: Number(editForm.stock) || 0,
      category: editForm.category,
      categorySlug,
      tagline: editForm.tagline.trim() || editingFullProduct.tagline,
      description: editForm.description.trim() || editingFullProduct.description,
      images: updatedImages,
      colors: editForm.colors.length > 0 ? editForm.colors : [
        { name: "Matte Black", hex: "#18181b" },
        { name: "Racing Red", hex: "#dc2626" },
        { name: "Gloss White", hex: "#ffffff" },
        { name: "Titanium Silver", hex: "#64748b" },
      ],
    };

    setProductList((prev) =>
      prev.map((p) => (p.id === editingFullProduct.id ? updatedProduct : p))
    );

    try {
      const res = await fetch(`/api/admin/products/${editingFullProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: updatedProduct.name,
          brand: updatedProduct.brand,
          productType: updatedProduct.productType,
          price: updatedProduct.price,
          compareAtPrice: updatedProduct.compareAtPrice,
          stock: updatedProduct.stock,
          categorySlug: updatedProduct.categorySlug,
          tagline: updatedProduct.tagline,
          description: updatedProduct.description,
          images: updatedProduct.images,
          colors: updatedProduct.colors,
        }),
      });

      if (res.ok) {
        showToast("Product Updated", `"${updatedProduct.name}" details saved successfully.`, "success");
      } else {
        showToast("Updated Locally", "Changes saved to screen.", "info");
      }
    } catch {
      showToast("Updated Locally", "Changes saved to screen.", "info");
    } finally {
      setIsSubmittingEdit(false);
      setEditingFullProduct(null);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrice) return;

    const sku = `MPX-${Math.floor(1000 + Math.random() * 9000)}`;
    const slug = newTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const categorySlug = newCategory.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const defaultCover =
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=600&auto=format&fit=crop";

    const newProd: Product = {
      id: `prod-${Date.now()}`,
      name: newTitle.trim(),
      slug,
      brand: newBrand || "Motoplex Genuine",
      productType: newProductType.trim() || undefined,
      category: newCategory,
      categorySlug,
      subcategory: newCategory,
      subcategorySlug: categorySlug,
      price: Number(newPrice),
      stock: Number(newStock) || 5,
      sku,
      images: newImage ? [newImage] : [defaultCover],
      tagline: `${newTitle.trim()} - Official Motoplex Bangladesh certified genuine product.`,
      description: "Premium genuine motorcycle gear with official Motoplex Bangladesh warranty.",
      rating: 5,
      reviewCount: 0,
      features: ["100% Genuine Official Import", "Official Warranty & Support"],
      specifications: {},
      variants: [],
      sizes: ["Standard"],
      colors: [{ name: "Matte Black", hex: "#18181b" }],
      materials: [],
      isFeatured: true,
      isBestSeller: false,
      isNewArrival: true,
    };

    setProductList([newProd, ...productList]);
    setIsAddModalOpen(false);
    showToast("Product Created", `${newTitle} added to Motoplex catalog.`, "success");
    setNewTitle("");
    setNewProductType("");
    setNewPrice("");
    setNewStock("");
    setNewImage("");

    try {
      await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProd.name,
          slug: newProd.slug,
          tagline: newProd.tagline || "Official Motoplex Bangladesh certified genuine product.",
          brand: newProd.brand,
          productType: newProd.productType,
          category: newProd.category,
          categorySlug: newProd.categorySlug,
          subcategory: newProd.subcategory,
          subcategorySlug: newProd.subcategorySlug,
          price: newProd.price,
          sku: newProd.sku,
          stock: newProd.stock,
          images: newProd.images,
          description: newProd.description || "Premium genuine motorcycle gear with official Motoplex Bangladesh warranty.",
          isFeatured: true,
          isNewArrival: true,
          isBestSeller: false,
          rating: 5,
          colors: newProd.colors,
          sizes: newProd.sizes,
          features: newProd.features,
        }),
      });
    } catch {
      // Graceful local addition
    }
  };

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
            PRODUCT & INVENTORY MANAGER
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Manage motorcycle parts, apparel, stock quantities & direct photo uploads
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-3 rounded-xl transition-all shadow-md shadow-red-600/20 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by product name, SKU, brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-red-600 focus:bg-white transition-colors"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-sm text-slate-800 font-semibold rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-red-600 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <span className="text-sm text-slate-600 font-medium whitespace-nowrap">
          Showing <strong className="text-slate-950 font-bold">{filtered.length}</strong> items
        </span>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/90 text-slate-700 text-xs font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="p-4 pl-6">Product & Details</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price (BDT)</th>
                <th className="p-4">Current Stock</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500 text-sm">
                    No products found in inventory. Click <strong className="text-red-600 font-bold">Add New Product</strong> above to add genuine products to your catalog!
                  </td>
                </tr>
              ) : filtered.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3.5">
                      <div
                        onClick={() => handleOpenEditImage(prod)}
                        className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 cursor-pointer group shadow-2xs"
                        title="Click to change product image"
                      >
                        <Image src={prod.images?.[0] || "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=600&auto=format&fit=crop"} alt="" fill className="object-cover group-hover:opacity-75 transition-opacity" />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Camera className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-950 text-sm leading-snug">
                          {prod.name}
                        </h4>
                        <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-slate-600 font-semibold">{prod.sku}</span>
                          <span>•</span>
                          <span className="text-red-600 font-bold">{prod.brand}</span>
                          {prod.productType && (
                            <>
                              <span>•</span>
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium text-[11px] border border-slate-200">
                                {prod.productType}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-slate-800 font-semibold text-sm">{prod.category}</td>
                  <td className="p-4 font-black text-slate-950 text-base font-mono">৳{prod.price.toLocaleString("en-BD")}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStockUpdate(prod.id, prod.stock - 1)}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 flex items-center justify-center font-bold text-sm transition-colors shadow-2xs"
                      >
                        -
                      </button>
                      <span
                        className={`font-black min-w-8 text-center text-sm font-mono ${
                          prod.stock <= 3 ? "text-amber-700" : "text-slate-950"
                        }`}
                      >
                        {prod.stock}
                      </span>
                      <button
                        onClick={() => handleStockUpdate(prod.id, prod.stock + 1)}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 flex items-center justify-center font-bold text-sm transition-colors shadow-2xs"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="p-4">
                    {prod.stock > 0 ? (
                      <span className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">
                        In Stock
                      </span>
                    ) : (
                      <span className="bg-red-50 border border-red-300 text-red-800 text-xs font-bold px-2.5 py-1 rounded-full">
                        Sold Out
                      </span>
                    )}
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <div className="flex items-center justify-end gap-2.5">
                      <button
                        onClick={() => handleOpenEditFullProduct(prod)}
                        className="text-xs text-blue-700 hover:text-blue-800 font-bold px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors shadow-2xs flex items-center gap-1.5"
                        title="Edit full product details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleOpenEditImage(prod)}
                        className="text-xs text-slate-800 hover:text-slate-950 font-bold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors shadow-2xs"
                        title="Upload new product photo"
                      >
                        Edit Photo
                      </button>
                      <Link
                        href={`/product/${prod.slug}`}
                        target="_blank"
                        className="text-xs text-red-600 hover:text-red-700 font-bold px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 transition-colors shadow-2xs"
                      >
                        Live →
                      </Link>
                      <button
                        onClick={() => handleDeleteProduct(prod.id, prod.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete product from catalog"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 space-y-4 shadow-2xl text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-slate-950">
                Add Product to Motoplex Inventory
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="font-bold text-slate-800 block mb-1.5 text-xs uppercase tracking-wide">Product Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Alpinestars Supertech Glove"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-bold text-slate-800 block mb-1.5 text-xs uppercase tracking-wide">Brand</label>
                  <input
                    type="text"
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1.5 text-xs uppercase tracking-wide">Product Type</label>
                  <input
                    type="text"
                    value={newProductType}
                    onChange={(e) => setNewProductType(e.target.value)}
                    placeholder="e.g. Full Exhaust System, Helmet"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="font-bold text-slate-800 block mb-1.5 text-xs uppercase tracking-wide">Price (BDT) *</label>
                  <input
                    type="number"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="e.g. 45000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1.5 text-xs uppercase tracking-wide">Initial Stock</label>
                  <input
                    type="number"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    placeholder="e.g. 10"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1.5 text-xs uppercase tracking-wide">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-semibold focus:outline-none focus:border-red-600 focus:bg-white cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Image Upload Field */}
              <ImageUpload
                value={newImage}
                onChange={setNewImage}
                label="Product Image (Upload File)"
                helperText="PNG, JPG or WEBP (Max 25MB)"
              />

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 bg-slate-100 text-slate-700 border border-slate-300 font-bold py-2.5 rounded-xl hover:bg-slate-200 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl hover:bg-red-700 shadow-md shadow-red-600/20 transition-all text-sm"
                >
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Image Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 space-y-4 shadow-2xl text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-base text-slate-950">Update Product Image</h3>
                <p className="text-xs text-slate-600 mt-0.5">{editingProduct.name}</p>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ImageUpload
              value={editingImage}
              onChange={setEditingImage}
              label="New Product Photo (Upload File)"
              helperText="Direct Image File (Max 25MB)"
            />

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="flex-1 bg-slate-100 text-slate-700 border border-slate-300 font-bold py-2.5 rounded-xl hover:bg-slate-200 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProductImage}
                disabled={!editingImage}
                className="flex-1 bg-red-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl hover:bg-red-700 shadow-md shadow-red-600/20 transition-all text-sm"
              >
                Save Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Edit Product Modal */}
      {editingFullProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white border border-slate-200 rounded-3xl shadow-2xl text-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-200 bg-slate-50/50">
              <div>
                <h3 className="font-bold text-lg text-slate-950">Edit Product Details</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  SKU: {editingFullProduct.sku} • {editingFullProduct.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingFullProduct(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveFullProduct} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="font-bold text-slate-800 block mb-1 text-xs uppercase tracking-wide">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="font-bold text-slate-800 block mb-1 text-xs uppercase tracking-wide">
                    Brand *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.brand}
                    onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1 text-xs uppercase tracking-wide">
                    Product Type
                  </label>
                  <input
                    type="text"
                    value={editForm.productType}
                    onChange={(e) => setEditForm({ ...editForm, productType: e.target.value })}
                    placeholder="e.g. Full Exhaust, Helmet"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1 text-xs uppercase tracking-wide">
                    Category
                  </label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-semibold focus:outline-none focus:border-red-600 focus:bg-white cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="font-bold text-slate-800 block mb-1 text-xs uppercase tracking-wide">
                    Price (BDT) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1 text-xs uppercase tracking-wide">
                    Compare Price (BDT)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.compareAtPrice}
                    onChange={(e) => setEditForm({ ...editForm, compareAtPrice: e.target.value })}
                    placeholder="Regular / MRP"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1 text-xs uppercase tracking-wide">
                    Current Stock *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editForm.stock}
                    onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1 text-xs uppercase tracking-wide">
                  Tagline / Subtitle
                </label>
                <input
                  type="text"
                  value={editForm.tagline}
                  onChange={(e) => setEditForm({ ...editForm, tagline: e.target.value })}
                  placeholder="Official Motoplex Bangladesh certified genuine product."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1 text-xs uppercase tracking-wide">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white resize-none"
                />
              </div>

              {/* Product Color Palette Selection */}
              <div>
                <label className="font-bold text-slate-800 block mb-1 text-xs uppercase tracking-wide">
                  Available Product Colors & Finishes (Click to toggle)
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {AVAILABLE_COLORS.map((col) => {
                    const isSelected = editForm.colors.some((c) => c.name === col.name);
                    return (
                      <button
                        key={col.name}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setEditForm({
                              ...editForm,
                              colors: editForm.colors.filter((c) => c.name !== col.name),
                            });
                          } else {
                            setEditForm({
                              ...editForm,
                              colors: [...editForm.colors, col],
                            });
                          }
                        }}
                        className={`flex items-center gap-2 py-1.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                          isSelected
                            ? "border-red-600 bg-red-50 text-red-950 ring-1 ring-red-600/30 font-bold"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-black/20 shadow-2xs flex items-center justify-center shrink-0"
                          style={{ backgroundColor: col.hex }}
                        >
                          {isSelected && (
                            <Check
                              className={`w-2.5 h-2.5 ${
                                col.hex.toLowerCase() === "#ffffff" ? "text-slate-900" : "text-white"
                              }`}
                            />
                          )}
                        </span>
                        <span>{col.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <ImageUpload
                  value={editForm.image}
                  onChange={(url) => setEditForm({ ...editForm, image: url })}
                  label="Product Photo (Cloudinary)"
                  helperText="Upload or change product image (Max 25MB)"
                />
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingFullProduct(null)}
                  className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold px-5 py-2.5 rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl shadow-md shadow-red-600/20 transition-all text-sm flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmittingEdit ? "Saving..." : "Save Product Details"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
