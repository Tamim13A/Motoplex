"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  Plus,
  Minus,
  Printer,
  RotateCcw,
  CreditCard,
  Banknote,
  QrCode,
  User,
  ShoppingBag,
  ArrowLeft,
} from "lucide-react";
import { products } from "@/data/products";
import { Product, ProductVariant, Order } from "@/types";
import { useToast } from "@/context/ToastContext";
import { InvoiceModal } from "@/components/ui/InvoiceModal";

interface POSCartItem {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
  unitPrice: number;
}

function generatePosOrderNumber(): string {
  return `POS-${Date.now().toString().slice(-6)}`;
}

export default function AdminPOSPage() {
  const { showToast } = useToast();

  // Search & Filter
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Cart & Customer
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [customerPhone, setCustomerPhone] = useState("");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "bKash" | "Card">("Cash");
  const [cashTendered, setCashTendered] = useState<string>("");

  // Receipt Modal
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [productList, setProductList] = useState<Product[]>(products);

  React.useEffect(() => {
    fetch("/api/admin/products?limit=500")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.success && Array.isArray(json.data?.products)) {
          setProductList(json.data.products);
        }
      })
      .catch(() => {});
  }, []);

  // Available categories
  const categoriesList = useMemo(() => {
    const cats = new Set(productList.map((p) => p.category));
    return ["all", ...Array.from(cats)];
  }, [productList]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return productList.filter((p) => {
      const matchesCat = selectedCategory === "all" || p.category === selectedCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.brand.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [productList, search, selectedCategory]);

  // Add product to cart
  const handleAddToCart = (product: Product, variant?: ProductVariant) => {
    const effectiveVariant = variant || product.variants?.[0];
    const price = effectiveVariant?.price || product.price;

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.variant?.sku === effectiveVariant?.sku
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      }

      return [
        ...prev,
        {
          product,
          variant: effectiveVariant,
          quantity: 1,
          unitPrice: price,
        },
      ];
    });

    showToast("Added to Bill", `${product.name} added.`, "info");
  };

  const handleUpdateQty = (index: number, delta: number) => {
    setCart((prev) => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      updated[index].quantity = newQty;
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearCart = () => {
    setCart([]);
    setDiscountAmount(0);
    setCashTendered("");
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const grandTotal = Math.max(0, subtotal - discountAmount);
  const tenderedNum = parseFloat(cashTendered) || 0;

  // Exact Paid, Change Return, and Due Amount Calculation
  let paidAmount = 0;
  let changeDue = 0;
  let dueAmount = 0;

  if (paymentMethod === "Cash") {
    if (tenderedNum > 0) {
      if (tenderedNum >= grandTotal) {
        paidAmount = grandTotal;
        changeDue = tenderedNum - grandTotal;
        dueAmount = 0;
      } else {
        paidAmount = tenderedNum;
        changeDue = 0;
        dueAmount = grandTotal - tenderedNum;
      }
    } else {
      paidAmount = grandTotal;
      changeDue = 0;
      dueAmount = 0;
    }
  } else {
    // bKash QR / Card POS
    paidAmount = grandTotal;
    changeDue = 0;
    dueAmount = 0;
  }

  const [isSubmittingSale, setIsSubmittingSale] = useState(false);

  // Complete Sale
  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      showToast("Cart Empty", "Please select products before billing.", "error");
      return;
    }

    setIsSubmittingSale(true);
    const orderNo = generatePosOrderNumber();

    const orderObj: Order = {
      id: orderNo,
      orderNumber: orderNo,
      date: new Date().toLocaleDateString("en-GB"),
      status: "Delivered",
      items: cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        productImage: item.product.images?.[0] || "",
        variantInfo: item.variant?.name || "Standard",
        price: item.unitPrice,
        quantity: item.quantity,
        total: item.unitPrice * item.quantity,
      })),
      subtotal,
      shippingFee: 0,
      discount: discountAmount,
      total: grandTotal,
      advancePaid: paidAmount,
      dueAmount: dueAmount,
      shippingAddress: {
        fullName: customerName || "Showroom Walk-in Customer",
        phone: customerPhone || "N/A",
        division: "Dhaka",
        district: "Dhaka",
        area: "Gulshan-2",
        address: "Motoplex Flagship Counter Sale",
      },
      deliveryMethod: "Showroom POS Counter",
      paymentMethod:
        paymentMethod === "bKash"
          ? "bKash QR"
          : paymentMethod === "Card"
          ? "Card POS"
          : "Cash (Showroom)",
      paymentStatus: dueAmount > 0 ? "Pending" : "Paid",
    };

    try {
      await fetch("/api/pos/sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: orderNo,
          items: cart.map((i) => ({
            productId: i.product.id,
            name: i.product.name,
            sku: i.variant?.sku || i.product.sku,
            price: i.unitPrice,
            quantity: i.quantity,
            image: i.product.images?.[0] || "",
            variantInfo: i.variant?.name || "Standard",
          })),
          customerName: customerName.trim() || "Showroom Walk-in Customer",
          customerPhone: customerPhone.trim() || "N/A",
          subtotal,
          discount: discountAmount,
          grandTotal,
          paymentMethod:
            paymentMethod === "bKash"
              ? "bKash QR"
              : paymentMethod === "Card"
              ? "Card POS"
              : "Cash",
          paidAmount,
          changeAmount: changeDue,
          dueAmount,
        }),
      });
    } catch (apiErr) {
      console.warn("POS Sale API error:", apiErr);
    } finally {
      setIsSubmittingSale(false);
    }

    setCompletedOrder(orderObj);
    setIsReceiptOpen(true);
    handleClearCart();

    if (dueAmount > 0) {
      showToast(
        "Sale Completed with Due",
        `Receipt #${orderNo} generated. ৳${dueAmount.toLocaleString("en-BD")} remaining as due balance.`,
        "warning"
      );
    } else {
      showToast(
        "Sale Completed!",
        `Receipt #${orderNo} generated successfully. Admin notified.`,
        "success"
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 rounded-xl transition-colors border border-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-base sm:text-lg font-black text-slate-950 tracking-tight uppercase">
                MOTOPLEX SHOWROOM POS TERMINAL
              </h1>
            </div>
            <p className="text-[11px] text-slate-500">
              Counter #01 • Gulshan-2 Flagship • Cashier: Authorized Officer
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClearCart}
            disabled={cart.length === 0}
            className="text-xs font-bold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-40"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Clear Bill
          </button>
        </div>
      </div>

      {/* Main 2-Column POS Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN: Product Catalog (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search & Category Filter */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Scan barcode, or search by product name, SKU, brand..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-600 focus:bg-white"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 scrollbar-none">
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap capitalize font-bold transition-colors ${
                    selectedCategory === cat
                      ? "bg-red-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:text-slate-950 border border-slate-200"
                  }`}
                >
                  {cat === "all" ? "All Products" : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-h-[640px] overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                <p className="text-sm font-semibold text-slate-600">No products available in POS inventory.</p>
                <p className="text-xs text-slate-400 mt-1">Add products via Products Manager to start selling in POS.</p>
              </div>
            ) : (
              filteredProducts.map((prod) => (
              <div
                key={prod.id}
                onClick={() => handleAddToCart(prod)}
                className="bg-white border border-slate-200 hover:border-red-500 rounded-2xl p-3.5 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md group shadow-2xs"
              >
                <div>
                  <div className="relative w-full h-32 rounded-xl overflow-hidden bg-slate-100 mb-2.5 border border-slate-200">
                    <Image
                      src={prod.images?.[0] || "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=600&auto=format&fit=crop"}
                      alt={prod.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-md bg-slate-900/80 text-white backdrop-blur-xs font-mono">
                      Stock: {prod.stock}
                    </span>
                  </div>

                  <span className="text-xs font-bold uppercase text-red-600 block truncate">
                    {prod.brand}
                  </span>
                  <h4 className="text-sm font-bold text-slate-950 line-clamp-2 leading-snug mt-0.5">
                    {prod.name}
                  </h4>
                  <span className="text-xs font-mono text-slate-500 block mt-1 font-semibold">
                    {prod.sku}
                  </span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-black text-slate-950 font-mono">
                    ৳{prod.price.toLocaleString("en-BD")}
                  </span>
                  <span className="w-7 h-7 rounded-lg bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white flex items-center justify-center transition-colors shadow-2xs">
                    <Plus className="w-4 h-4" />
                  </span>
                </div>
              </div>
            )))}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Cart & Billing Terminal (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-xs">
          <div className="space-y-4">
            {/* Customer Details Bar */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5 text-xs shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs uppercase tracking-wider">
                <User className="w-4 h-4 text-red-600" /> Walk-In Customer Details
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer Name"
                  className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:outline-none focus:border-red-600"
                />
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Phone Number"
                  className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm font-mono focus:outline-none focus:border-red-600"
                />
              </div>
            </div>

            {/* Cart Items List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider pb-1.5 border-b border-slate-200">
                <span>Selected Items ({cart.length})</span>
                <span>Amount</span>
              </div>

              <div className="max-h-[240px] overflow-y-auto space-y-2 pr-1">
                {cart.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm space-y-1.5">
                    <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="font-bold text-slate-700">Bill cart is empty</p>
                    <span className="text-xs text-slate-500 font-medium">Scan or select products to start sale</span>
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-sm shadow-2xs"
                    >
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-slate-950 truncate text-sm">{item.product.name}</h5>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                          <span>৳{item.unitPrice.toLocaleString("en-BD")}</span>
                          {item.variant && <span>• {item.variant.name}</span>}
                        </div>
                      </div>

                      {/* Qty Controls */}
                      <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                        <button
                          onClick={() => handleUpdateQty(idx, -1)}
                          className="text-slate-600 hover:text-slate-950 p-0.5 font-bold"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-black font-mono text-sm w-5 text-center text-slate-950">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQty(idx, 1)}
                          className="text-slate-600 hover:text-slate-950 p-0.5 font-bold"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Line Total */}
                      <div className="text-right pl-2">
                        <span className="font-black text-slate-950 font-mono text-sm block">
                          ৳{(item.unitPrice * item.quantity).toLocaleString("en-BD")}
                        </span>
                        <button
                          onClick={() => handleRemoveItem(idx)}
                          className="text-xs text-red-600 hover:text-red-700 font-bold transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Pricing & Tender Bottom Section */}
          <div className="space-y-3 pt-3 border-t border-slate-200 text-sm">
            {/* Discount input */}
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-700 font-bold text-xs">Custom Showroom Discount (BDT):</span>
              <input
                type="number"
                min="0"
                value={discountAmount || ""}
                onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-32 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-right text-emerald-700 font-mono font-bold focus:outline-none focus:border-red-600 text-sm"
              />
            </div>

            {/* Subtotal & Grand Total */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex justify-between text-slate-700 font-semibold text-sm">
                <span>Subtotal:</span>
                <span className="font-mono font-bold text-slate-950">৳{subtotal.toLocaleString("en-BD")}</span>
              </div>
              <div className="flex justify-between text-lg font-black text-slate-950 pt-1 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="text-red-600 font-mono text-xl">৳{grandTotal.toLocaleString("en-BD")}</span>
              </div>
            </div>

            {/* Payment Method Switcher */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("Cash")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  paymentMethod === "Cash"
                    ? "bg-red-600 text-white border-red-600 shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <Banknote className="w-3.5 h-3.5" /> Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("bKash")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  paymentMethod === "bKash"
                    ? "bg-red-600 text-white border-red-600 shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <QrCode className="w-3.5 h-3.5" /> bKash QR
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("Card")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  paymentMethod === "Card"
                    ? "bg-red-600 text-white border-red-600 shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" /> Card POS
              </button>
            </div>

            {/* Cash Tender Calculation */}
            {paymentMethod === "Cash" && (
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-slate-800 font-bold block">Cash Received (কাস্টমার দিলেন):</span>
                    <span className="text-[10px] text-slate-500">নগদ প্রাপ্ত টাকা লিখুন</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-slate-400 font-bold text-xs">৳</span>
                    <input
                      type="number"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      placeholder={grandTotal.toString()}
                      className="w-36 bg-white border border-slate-300 rounded-xl pl-6 pr-3 py-1.5 text-right text-slate-900 font-mono font-bold text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Quick Cash Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Quick:</span>
                  <button
                    type="button"
                    onClick={() => setCashTendered(grandTotal.toString())}
                    className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] rounded-lg border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                  >
                    Exact (৳{grandTotal.toLocaleString("en-BD")})
                  </button>
                  {[500, 1000, 2000, 3000, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCashTendered(amt.toString())}
                      className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] rounded-lg border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                    >
                      ৳{amt}
                    </button>
                  ))}
                  {cashTendered && (
                    <button
                      type="button"
                      onClick={() => setCashTendered("")}
                      className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[11px] rounded-lg border border-rose-200 transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Change Return & Due Balance Display */}
                {tenderedNum > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-200 animate-in fade-in duration-200">
                    {changeDue > 0 ? (
                      <div className="flex justify-between items-center bg-emerald-50 text-emerald-900 p-2.5 rounded-xl border border-emerald-200">
                        <div>
                          <span className="font-bold text-xs block text-emerald-900">
                            Change Return (কাস্টমার ফেরত পাবেন):
                          </span>
                          <span className="text-[10px] text-emerald-700 font-medium">
                            ফুল পেমেন্ট সম্পন্ন হয়েছে
                          </span>
                        </div>
                        <span className="font-mono font-black text-base text-emerald-700">
                          ৳{changeDue.toLocaleString("en-BD")}
                        </span>
                      </div>
                    ) : dueAmount > 0 ? (
                      <div className="flex justify-between items-center bg-amber-50 text-amber-950 p-2.5 rounded-xl border border-amber-300">
                        <div>
                          <span className="font-bold text-xs block text-amber-900">
                            Due Balance (বাকি / বকেয়া টাকা):
                          </span>
                          <span className="text-[10px] text-amber-700 font-medium">
                            বকেয়া হিসেবে সিস্টেমে সংরক্ষিত হবে
                          </span>
                        </div>
                        <span className="font-mono font-black text-base text-rose-600">
                          ৳{dueAmount.toLocaleString("en-BD")}
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center bg-emerald-50 text-emerald-800 p-2 rounded-xl text-xs font-bold border border-emerald-200">
                        <span>Payment Status:</span>
                        <span className="text-emerald-700 font-mono">
                          Exact Paid (৳0 Change • ৳0 Due)
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Complete Sale Button */}
            <button
              onClick={handleCompleteSale}
              disabled={cart.length === 0 || isSubmittingSale}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3.5 rounded-xl transition-all shadow-md shadow-red-600/20 flex items-center justify-center gap-2 uppercase tracking-wide text-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{isSubmittingSale ? "Recording Sale..." : "Complete Sale & Print Receipt"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {completedOrder && (
        <InvoiceModal
          order={completedOrder}
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
        />
      )}
    </div>
  );
}
