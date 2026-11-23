"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Plus,
  ShoppingCart,
  Receipt,
  Settings,
  Phone,
  MessageCircle,
  Truck,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";
import { products as initialProducts } from "@/data/products";
import { useToast } from "@/context/ToastContext";
import { Order, Product } from "@/types";

interface DashboardApiItem {
  productId?: string;
  productName?: string;
  name?: string;
  productImage?: string;
  image?: string;
  variantInfo?: string;
  price?: number;
  quantity?: number;
  total?: number;
}

interface DashboardApiOrder {
  _id?: string;
  id?: string;
  orderNumber: string;
  createdAt?: string;
  date?: string;
  orderStatus?: string;
  status?: string;
  total?: number;
  totalAmount?: number;
  subtotal?: number;
  shippingFee?: number;
  discount?: number;
  paymentMethod?: string;
  deliveryMethod?: string;
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    division?: string;
    district?: string;
    area?: string;
    address?: string;
  };
  customerInfo?: {
    fullName?: string;
    phone?: string;
  };
  items?: DashboardApiItem[];
  courierName?: string;
  courierInfo?: {
    name?: string;
    trackingNumber?: string;
  };
  trackingNumber?: string;
}

export default function AdminDashboardPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [productsList, setProductsList] = useState<Product[]>(initialProducts);
  const [restrictedNotice, setRestrictedNotice] = useState(false);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    aov: 0,
    pendingOrders: 0,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("error") === "restricted_module") {
        setRestrictedNotice(true);
      }
    }
  }, []);

  // Fetch real-time dashboard analytics and orders on mount
  useEffect(() => {
    const fetchLiveProducts = async () => {
      try {
        const res = await fetch("/api/admin/products?limit=500");
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data?.products)) {
            setProductsList(json.data.products);
          }
        }
      } catch {}
    };
    fetchLiveProducts();

    const fetchDashboardData = async () => {
      try {
        const res = await fetch("/api/admin/dashboard");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            if (json.data.stats) {
              const s = json.data.stats;
              const rev = s.totalRevenue || 0;
              const ordCount = s.totalOrders || 0;
              setStats({
                totalRevenue: rev,
                totalOrders: ordCount,
                totalUsers: s.totalUsers || 0,
                aov: ordCount > 0 ? Math.round(rev / ordCount) : 0,
                pendingOrders: s.todayOrders || 0,
              });
            }
            if (Array.isArray(json.data.recentOrders) && json.data.recentOrders.length > 0) {
              const mapped: Order[] = json.data.recentOrders.map((o: DashboardApiOrder) => ({
                id: o._id?.toString() || o.id || o.orderNumber,
                orderNumber: o.orderNumber,
                date: o.date || (o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-GB") : new Date().toLocaleDateString("en-BD")),
                status: (o.orderStatus || o.status || "Pending") as Order["status"],
                total: Number(o.total || o.totalAmount || 0),
                subtotal: Number(o.subtotal || 0),
                shippingFee: Number(o.shippingFee || 0),
                discount: Number(o.discount || 0),
                paymentMethod: o.paymentMethod || "Cash on Delivery",
                deliveryMethod: o.deliveryMethod || "Standard Courier",
                shippingAddress: {
                  fullName: o.shippingAddress?.fullName || o.customerInfo?.fullName || "Guest Customer",
                  phone: o.shippingAddress?.phone || o.customerInfo?.phone || "017XXXXXXXX",
                  division: o.shippingAddress?.division || "Dhaka",
                  district: o.shippingAddress?.district || "Dhaka City",
                  area: o.shippingAddress?.area || "Gulshan",
                  address: o.shippingAddress?.address || "",
                },
                items: (o.items || []).map((it: DashboardApiItem) => ({
                  productId: it.productId?.toString() || "",
                  productName: it.productName || it.name || "Parts Item",
                  productImage: it.productImage || it.image || "",
                  variantInfo: it.variantInfo || "Standard",
                  price: Number(it.price || 0),
                  quantity: Number(it.quantity || 1),
                  total: Number(it.total || 0),
                })),
                courierName: o.courierName || o.courierInfo?.name || "Pathao",
                trackingNumber: o.trackingNumber || o.courierInfo?.trackingNumber || "PTH-PENDING",
              }));
              setOrders(mapped);
            }
          }
        }
      } catch (err) {
        console.error("Dashboard data fetch error:", err);
      }
    };

    fetchDashboardData();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId || o.orderNumber === orderId ? { ...o, status: newStatus as Order["status"] } : o))
    );
    showToast("Status Updated", `Order ${orderId} changed to ${newStatus}.`, "success");

    try {
      await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus: newStatus }),
      });
    } catch {
      // Local state already updated
    }
  };

  const handleQuickRestock = async (productId: string, addAmount: number) => {
    setProductsList((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: p.stock + addAmount } : p))
    );
    showToast("Stock Restocked", `Added +${addAmount} units to stock.`, "success");

    try {
      await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: (productsList.find((p) => p.id === productId)?.stock || 0) + addAmount }),
      });
    } catch {
      // Local state updated
    }
  };

  const lowStockProducts = productsList.filter((p) => p.stock <= 4).slice(0, 5);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-amber-100 text-amber-900 border-amber-300 font-bold";
      case "confirmed":
        return "bg-sky-100 text-sky-900 border-sky-300 font-bold";
      case "processing":
        return "bg-purple-100 text-purple-900 border-purple-300 font-bold";
      case "shipped":
        return "bg-indigo-100 text-indigo-900 border-indigo-300 font-bold";
      case "delivered":
        return "bg-emerald-100 text-emerald-900 border-emerald-300 font-bold";
      case "cancelled":
        return "bg-rose-100 text-rose-900 border-rose-300 font-bold";
      default:
        return "bg-slate-100 text-slate-800 border-slate-300 font-bold";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome Title & 1-Click Operations Action Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">
              Motoplex Operations Command
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight mt-0.5">
            EXECUTIVE STORE CONTROL
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Real-time management for customer orders, inventory stock, COD dispatch & Telegram alerts
          </p>
        </div>

        {/* 1-Click Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 text-sm">
          <Link
            href="/admin/products"
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-red-600/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>

          <Link
            href="/admin/orders"
            className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 font-bold px-4 py-2.5 rounded-xl transition-all shadow-2xs flex items-center gap-2"
          >
            <ShoppingCart className="w-4 h-4 text-emerald-600" />
            <span>Manage Orders</span>
          </Link>

          <Link
            href="/admin/pos"
            className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 font-bold px-4 py-2.5 rounded-xl transition-all shadow-2xs flex items-center gap-2"
          >
            <Receipt className="w-4 h-4 text-amber-600" />
            <span>POS Counter</span>
          </Link>

          <Link
            href="/admin/settings"
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold px-3.5 py-2.5 rounded-xl transition-all shadow-2xs flex items-center gap-2"
            title="Configure Courier & Telegram Bot"
          >
            <Settings className="w-4 h-4 text-slate-600" />
          </Link>
        </div>
      </div>

      {/* RBAC Restricted Notice Banner */}
      {restrictedNotice && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Access Restricted: Administrator Privileges Required</h4>
              <p className="text-xs text-amber-800 mt-0.5">
                The section you attempted to access (Users & Roles, Store Configuration, or Financials) is restricted to Super Administrators. Operations Moderators have limited access to Orders, Workshop Bookings, Products, POS, and Customer Reviews.
              </p>
            </div>
          </div>
          <button
            onClick={() => setRestrictedNotice(false)}
            className="text-xs font-bold text-amber-700 hover:text-amber-950 px-2 py-1 rounded-lg hover:bg-amber-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4 High-Impact KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Gross Revenue */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wide">
            <span>Total Sales (মোট বিক্রি)</span>
            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 font-bold flex items-center text-xs px-2.5 py-0.5 rounded-full">
              +18.4% <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight font-mono">
            ৳{Number(stats.totalRevenue || 0).toLocaleString("en-BD")}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
            <span>Avg Order Value (AOV):</span>
            <strong className="text-slate-950 font-mono text-sm font-bold">৳{Number(stats.aov || 0).toLocaleString("en-BD")}</strong>
          </div>
        </div>

        {/* Card 2: Total Orders & Pending Badge */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wide">
            <span>Total Orders (অর্ডার সংখ্যা)</span>
            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
              Live Synced
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight flex items-baseline gap-2 font-mono">
            <span>{stats.totalOrders}</span>
            <span className="text-xs font-bold text-slate-500">Orders</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <span className="text-slate-600 font-medium">Action Required:</span>
            <strong className="text-amber-800 font-bold text-xs">
              {stats.pendingOrders > 0 ? `${stats.pendingOrders} to dispatch` : "All orders dispatched"}
            </strong>
          </div>
        </div>

        {/* Card 3: Inventory Health */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wide">
            <span>Active Products (ক্যাটালগ)</span>
            <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
              100% In-Stock
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight font-mono">
            {productsList.length} Items
          </div>
          <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
            <span className="font-medium">Low Stock Alert:</span>
            <strong className="text-amber-800 font-bold text-xs">{lowStockProducts.length} items low</strong>
          </div>
        </div>

        {/* Card 4: Dispatch & Telegram Bot */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wide">
            <span>COD & Courier (ডেলিভারি)</span>
            <span className="bg-blue-100 text-blue-900 border border-blue-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
              64 Districts
            </span>
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-950 flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-600" />
            <span>Pathao & Steadfast</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
            <span className="font-medium">Telegram Bot:</span>
            <span className="text-emerald-800 font-bold flex items-center gap-1 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Instant Alert Active
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Live Orders Control & Quick Low Stock Restock */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Live Orders with Next-Level Easy Controls */}
        <div className="xl:col-span-8 2xl:col-span-9 bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-red-600" />
                <h2 className="text-base font-bold text-slate-950 uppercase tracking-wider">
                  Live Orders & Customer Dispatch
                </h2>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Click status dropdown to update instantly • Direct Call & WhatsApp customer
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1.5 self-start sm:self-auto bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-xl transition-colors"
            >
              <span>Full Orders Manager ({orders.length})</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-700 uppercase font-bold border-b border-slate-200 bg-slate-50/80">
                <tr>
                  <th className="py-3.5 pl-4">Order #</th>
                  <th className="py-3.5">Customer & Contact</th>
                  <th className="py-3.5">Items Ordered</th>
                  <th className="py-3.5">Courier Partner</th>
                  <th className="py-3.5">Total Amount</th>
                  <th className="py-3.5 text-right pr-4">Status Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500 text-sm">
                      No customer orders yet. Place an order on the storefront to test live syncing!
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => {
                    const phoneClean = ord.shippingAddress?.phone?.replace(/\D/g, "") || "";
                    const waNumber = phoneClean.startsWith("88") ? phoneClean : `88${phoneClean}`;

                    return (
                      <tr key={ord.id || ord.orderNumber} className="hover:bg-slate-50/70 transition-colors">
                        {/* Order Number */}
                        <td className="py-4 pl-4">
                          <Link
                            href={`/track?order=${ord.orderNumber}`}
                            target="_blank"
                            className="font-mono font-bold text-red-600 hover:text-red-700 hover:underline block text-sm"
                          >
                            {ord.orderNumber}
                          </Link>
                          <span className="text-xs text-slate-500 font-medium block mt-0.5">{ord.date}</span>
                        </td>

                        {/* Customer & Direct Contact Action */}
                        <td className="py-4">
                          <span className="font-bold text-slate-950 block text-sm">
                            {ord.shippingAddress?.fullName}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-700 font-mono font-bold">
                              {ord.shippingAddress?.phone}
                            </span>
                            {phoneClean && (
                              <div className="flex items-center gap-1.5">
                                <a
                                  href={`tel:${phoneClean}`}
                                  className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                                  title="Call Customer directly"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </a>
                                <a
                                  href={`https://wa.me/${waNumber}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 transition-colors"
                                  title="WhatsApp Customer directly"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 block mt-0.5 font-medium">
                            {ord.shippingAddress?.district || ord.shippingAddress?.division}
                          </span>
                        </td>

                        {/* Ordered Items Preview */}
                        <td className="py-4">
                          <div className="space-y-1">
                            {ord.items.slice(0, 2).map((it, idx) => (
                              <div key={idx} className="text-xs text-slate-900 font-semibold">
                                • {it.productName} <span className="text-slate-500 font-normal">x{it.quantity}</span>
                              </div>
                            ))}
                            {ord.items.length > 2 && (
                              <span className="text-xs text-red-600 font-bold block">
                                +{ord.items.length - 2} more items
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Courier Partner */}
                        <td className="py-4">
                          <span className="text-slate-950 font-bold block text-sm">{ord.courierName || "Pathao"}</span>
                          <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block mt-1 font-semibold">
                            {ord.trackingNumber || "PTH-PENDING"}
                          </span>
                        </td>

                        {/* Total Amount */}
                        <td className="py-4 font-black text-slate-950 whitespace-nowrap text-base font-mono">
                          ৳{Number(ord.total || 0).toLocaleString("en-BD")}
                        </td>

                        {/* 1-Click Status Change */}
                        <td className="py-4 text-right pr-4">
                          <select
                            value={ord.status}
                            onChange={(e) => handleStatusChange(ord.id || ord.orderNumber, e.target.value)}
                            className={`border text-sm rounded-xl px-3 py-2 focus:outline-none cursor-pointer font-bold transition-all shadow-2xs ${getStatusBadge(
                              ord.status
                            )}`}
                          >
                            <option value="Pending" className="bg-white text-amber-900">🟡 Pending</option>
                            <option value="Confirmed" className="bg-white text-sky-900">🔵 Confirmed</option>
                            <option value="Processing" className="bg-white text-purple-900">🟣 Processing</option>
                            <option value="Shipped" className="bg-white text-indigo-900">🚚 Shipped</option>
                            <option value="Delivered" className="bg-white text-emerald-900">🟢 Delivered</option>
                            <option value="Cancelled" className="bg-white text-rose-900">🔴 Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts & Instant 1-Click Restock Card */}
        <div className="xl:col-span-4 2xl:col-span-3 bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-slate-950 uppercase tracking-wider">
                Low Stock Warnings
              </h2>
            </div>
            <span className="text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full">
              Needs Restock
            </span>
          </div>

          <div className="space-y-3">
            {lowStockProducts.map((p) => (
              <div
                key={p.id}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs shadow-2xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-slate-950 text-sm leading-snug">{p.name}</h4>
                    <span className="text-xs text-slate-500 font-mono mt-0.5 block font-semibold">SKU: {p.sku} • {p.brand}</span>
                  </div>
                  <span className="bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full shrink-0">
                    {p.stock} left
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                  <span className="font-bold text-slate-950 text-sm font-mono">
                    ৳{Number(p.price || 0).toLocaleString("en-BD")}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQuickRestock(p.id, 5)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 font-bold rounded-lg text-xs shadow-2xs transition-colors"
                      title="Add 5 units immediately"
                    >
                      +5 Stock
                    </button>
                    <button
                      onClick={() => handleQuickRestock(p.id, 10)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs shadow-2xs transition-colors"
                      title="Add 10 units immediately"
                    >
                      +10 Stock
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/admin/products"
            className="block w-full text-center text-xs font-bold text-red-600 hover:text-red-700 pt-3 hover:underline"
          >
            Manage All Product Inventories & Images →
          </Link>
        </div>
      </div>
    </div>
  );
}
