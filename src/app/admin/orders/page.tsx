"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Search,
  Truck,
  Printer,
  RefreshCw,
  Phone,
  MessageCircle,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { InvoiceModal } from "@/components/ui/InvoiceModal";
import { Order } from "@/types";
import { formatDateSafe } from "@/lib/formatters";

interface AdminApiItem {
  productId?: string;
  productName?: string;
  name?: string;
  productImage?: string;
  image?: string;
  variantInfo?: string;
  variantSku?: string;
  variantDetails?: { size?: string; color?: string };
  price?: number;
  quantity?: number;
  total?: number;
}

interface AdminApiOrder {
  _id?: string;
  id?: string;
  orderNumber: string;
  userId?: string;
  createdAt?: string;
  date?: string;
  orderStatus?: string;
  status?: string;
  total?: number;
  totalAmount?: number;
  subtotal?: number;
  shippingFee?: number;
  advancePaid?: number;
  dueAmount?: number;
  paymentDetails?: {
    advancePaymentMethod?: string;
    advanceAmount?: number;
    senderNumber?: string;
    trxId?: string;
    bankName?: string;
    accountNumber?: string;
    reference?: string;
  };
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
    addressLine1?: string;
  };
  customerInfo?: {
    fullName?: string;
    phone?: string;
  };
  items?: AdminApiItem[];
  courierName?: string;
  courierInfo?: {
    name?: string;
    trackingNumber?: string;
  };
  trackingNumber?: string;
}

function generateTrackingCode(courier: string): string {
  return `${courier.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-6)}`;
}

export default function AdminOrdersManagerPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAdminOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/orders?limit=500");
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && Array.isArray(json.data?.orders) && json.data.orders.length > 0) {
        const mapped: Order[] = json.data.orders.map((o: AdminApiOrder) => ({
          id: o._id?.toString() || o.id || o.orderNumber,
          orderNumber: o.orderNumber,
          userId: o.userId?.toString() || "guest",
          date: o.date || formatDateSafe(o.createdAt),
          status: (o.orderStatus || o.status || "Pending") as Order["status"],
          total: Number(o.total || o.totalAmount || 0),
          subtotal: Number(o.subtotal || 0),
          shippingFee: Number(o.shippingFee || 0),
          advancePaid: Number(o.advancePaid ?? o.shippingFee ?? 0),
          dueAmount: Number(o.dueAmount ?? o.subtotal ?? 0),
          paymentDetails: o.paymentDetails,
          discount: Number(o.discount || 0),
          paymentMethod: o.paymentMethod || "Cash on Delivery",
          deliveryMethod: o.deliveryMethod || "Pathao Express",
          shippingAddress: {
            fullName: o.shippingAddress?.fullName || o.customerInfo?.fullName || "Guest Customer",
            phone: o.shippingAddress?.phone || o.customerInfo?.phone || "017XXXXXXXX",
            division: o.shippingAddress?.division || "Dhaka",
            district: o.shippingAddress?.district || "Dhaka City",
            area: o.shippingAddress?.area || "Gulshan",
            address: o.shippingAddress?.address || o.shippingAddress?.addressLine1 || "",
          },
          items: (o.items || []).map((it: AdminApiItem) => ({
            productId: it.productId?.toString() || "",
            productName: it.productName || it.name || "Parts Item",
            productImage: it.productImage || it.image || "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=300&auto=format&fit=crop",
            variantInfo: it.variantInfo || it.variantSku || [it.variantDetails?.size, it.variantDetails?.color].filter(Boolean).join(" / ") || "Standard",
            price: Number(it.price || 0),
            quantity: Number(it.quantity || 1),
            total: Number(it.total || ((it.price || 0) * (it.quantity || 1)) || 0),
          })),
          courierName: o.courierName || o.courierInfo?.name || "Pathao",
          trackingNumber: o.trackingNumber || o.courierInfo?.trackingNumber || "PTH-PENDING",
        }));
        setOrders(mapped);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminOrders();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id || o.orderNumber === id ? { ...o, status: status as Order["status"] } : o))
    );
    showToast("Status Updated", `Order ${id} changed to ${status}.`, "success");

    try {
      await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus: status }),
      });
    } catch {
      // Local state already updated
    }
  };

  const handleAssignCourier = async (
    id: string,
    courier: "Pathao" | "Steadfast" | "RedX",
    existingTracking?: string
  ) => {
    const trackingNumber =
      existingTracking && existingTracking !== "PTH-PENDING"
        ? existingTracking
        : generateTrackingCode(courier);

    setOrders((prev) =>
      prev.map((o) => (o.id === id || o.orderNumber === id ? { ...o, courierName: courier, trackingNumber } : o))
    );
    showToast("Courier Assigned", `Assigned to ${courier} Courier with code ${trackingNumber}.`, "info");

    try {
      await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courierInfo: {
            name: courier,
            trackingNumber,
          },
        }),
      });
    } catch {
      // Local state already updated
    }
  };

  const handleTrackingUpdate = async (id: string, trackingNumber: string, courierName?: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id || o.orderNumber === id ? { ...o, trackingNumber } : o))
    );

    try {
      await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courierInfo: {
            name: courierName || "Pathao",
            trackingNumber,
          },
        }),
      });
    } catch {
      // Local state already updated
    }
  };

  const statusCounts = {
    all: orders.length,
    pending: orders.filter((o) => o.status.toLowerCase() === "pending").length,
    confirmed: orders.filter((o) => o.status.toLowerCase() === "confirmed").length,
    processing: orders.filter((o) => o.status.toLowerCase() === "processing").length,
    shipped: orders.filter((o) => o.status.toLowerCase() === "shipped").length,
    delivered: orders.filter((o) => o.status.toLowerCase() === "delivered").length,
    cancelled: orders.filter((o) => o.status.toLowerCase() === "cancelled").length,
  };

  const filtered = orders.filter((o) => {
    const matchesStatus =
      filterStatus === "all" || o.status.toLowerCase() === filterStatus.toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.shippingAddress?.fullName?.toLowerCase().includes(q) ||
      o.shippingAddress?.phone?.includes(q) ||
      o.items.some((i) => i.productName.toLowerCase().includes(q));

    return matchesStatus && matchesSearch;
  });

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
            ORDER FULFILLMENT & DISPATCH
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Manage incoming orders, 1-click status updates, direct customer contact & courier assignment
          </p>
        </div>

        <button
          onClick={fetchAdminOrders}
          disabled={isLoading}
          className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all shadow-2xs flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-red-600" : "text-slate-600"}`} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Filter Tabs & Quick Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: "all", label: "All Orders", count: statusCounts.all },
            { id: "pending", label: "Pending", count: statusCounts.pending },
            { id: "confirmed", label: "Confirmed", count: statusCounts.confirmed },
            { id: "processing", label: "Packing", count: statusCounts.processing },
            { id: "shipped", label: "Shipped", count: statusCounts.shipped },
            { id: "delivered", label: "Delivered", count: statusCounts.delivered },
            { id: "cancelled", label: "Cancelled", count: statusCounts.cancelled },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                filterStatus === tab.id
                  ? "bg-red-600 text-white shadow-sm shadow-red-600/30"
                  : "text-slate-700 hover:text-slate-950 bg-slate-50 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  filterStatus === tab.id
                    ? "bg-black/30 text-white"
                    : "bg-slate-200 text-slate-800"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search order #, phone, name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-red-600 focus:bg-white transition-colors"
            />
          </div>
          <span className="text-slate-600 font-medium whitespace-nowrap">
            Showing <strong className="text-slate-950">{filtered.length}</strong>
          </span>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/90 text-slate-700 text-xs font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="p-4 pl-6">Order ID & Date</th>
                <th className="p-4">Customer & Contact</th>
                <th className="p-4">Ordered Products</th>
                <th className="p-4">Delivery Address</th>
                <th className="p-4">Courier & Code</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500 text-sm">
                    No orders matching &quot;{filterStatus}&quot;.
                  </td>
                </tr>
              ) : (
                filtered.map((ord) => {
                  const phoneClean = ord.shippingAddress?.phone?.replace(/\D/g, "") || "";
                  const waNumber = phoneClean.startsWith("88") ? phoneClean : `88${phoneClean}`;

                  return (
                    <tr key={ord.id || ord.orderNumber} className="hover:bg-slate-50/70 transition-colors">
                      {/* Order Number & Date */}
                      <td className="p-4 pl-6">
                        <Link
                          href={`/track?order=${ord.orderNumber}`}
                          target="_blank"
                          className="font-mono font-bold text-red-600 hover:text-red-700 hover:underline block text-sm"
                          title="Open live tracking"
                        >
                          {ord.orderNumber}
                        </Link>
                        <span className="text-xs text-slate-500 font-medium block mt-0.5">{ord.date}</span>
                        {ord.paymentDetails?.advancePaymentMethod ? (
                          <div className="mt-1 space-y-1">
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold block ${
                                ord.status === "Pending"
                                  ? "bg-amber-50 text-amber-900 border border-amber-300"
                                  : "bg-emerald-50 text-emerald-800 border border-emerald-300"
                              }`}
                            >
                              {ord.status === "Pending" ? "🟡 যাচাই পেন্ডিং:" : "🟢 পেমেন্ট ভেরিফাইড:"} ৳{ord.advancePaid ?? ord.shippingFee} ({ord.paymentDetails.advancePaymentMethod.includes("bKash") ? "bKash" : "Bank"})
                            </span>
                            {ord.paymentDetails.trxId && (
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(ord.paymentDetails?.trxId || "");
                                  showToast("TrxID কপি হয়েছে", `TrxID ${ord.paymentDetails?.trxId} কপি করা হয়েছে`, "success");
                                }}
                                className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-1.5 py-0.5 rounded transition-colors"
                                title="Click to copy TrxID"
                              >
                                <span>Trx: {ord.paymentDetails.trxId}</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded mt-1 inline-block font-semibold">
                            COD Payment
                          </span>
                        )}
                      </td>

                      {/* Customer & Call / WhatsApp */}
                      <td className="p-4">
                        <strong className="text-slate-950 block text-sm font-bold">
                          {ord.shippingAddress?.fullName}
                        </strong>
                        <div className="flex items-center gap-1.5 mt-1 font-mono text-xs text-slate-700 font-bold">
                          <span>{ord.shippingAddress?.phone}</span>
                        </div>
                        {phoneClean && (
                          <div className="flex items-center gap-2 mt-1.5">
                            <a
                              href={`tel:${phoneClean}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-colors"
                              title="Call customer directly"
                            >
                              <Phone className="w-3 h-3" /> Call
                            </a>
                            <a
                              href={`https://wa.me/${waNumber}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 text-xs font-bold transition-colors"
                              title="Message via WhatsApp"
                            >
                              <MessageCircle className="w-3 h-3" /> WhatsApp
                            </a>
                          </div>
                        )}
                      </td>

                      {/* Products Ordered Preview */}
                      <td className="p-4">
                        <div className="space-y-1.5 min-w-[200px]">
                          {ord.items.map((it, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs">
                              {it.productImage && (
                                <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                                  <Image src={it.productImage} alt="" fill className="object-cover" />
                                </div>
                              )}
                              <div>
                                <span className="font-semibold text-slate-900 block">{it.productName}</span>
                                <span className="text-xs text-slate-500 font-mono">Qty: {it.quantity} • ৳{Number(it.price || 0).toLocaleString("en-BD")}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Delivery Address */}
                      <td className="p-4 text-slate-700 min-w-[180px]">
                        <span className="block text-xs font-medium text-slate-900">{ord.shippingAddress?.address}</span>
                        <span className="text-xs text-slate-600 block mt-0.5 font-semibold">
                          {ord.shippingAddress?.area ? `${ord.shippingAddress.area}, ` : ""}{ord.shippingAddress?.district}
                        </span>
                        <span className="text-xs text-slate-500 block">
                          Division: {ord.shippingAddress?.division}
                        </span>
                      </td>

                      {/* Courier Partner & Consignment Code */}
                      <td className="p-4 space-y-1.5 min-w-[160px]">
                        <select
                          value={ord.courierName || "Pathao"}
                          onChange={(e) => handleAssignCourier(ord.id || ord.orderNumber, e.target.value as "Pathao" | "Steadfast" | "RedX", ord.trackingNumber)}
                          className="bg-white border border-slate-300 text-slate-900 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-red-600 cursor-pointer text-xs w-full shadow-2xs font-semibold"
                        >
                          <option value="Pathao">Pathao Express</option>
                          <option value="Steadfast">Steadfast Courier</option>
                          <option value="RedX">RedX Logistics</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Tracking Code"
                          value={ord.trackingNumber || ""}
                          onChange={(e) => handleTrackingUpdate(ord.id || ord.orderNumber, e.target.value, ord.courierName)}
                          className="bg-slate-50 border border-slate-300 text-xs font-mono text-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-red-600 focus:bg-white w-full"
                          title="Edit or view courier tracking code"
                        />
                      </td>

                      {/* Total Value */}
                      <td className="p-4 font-black text-slate-950 whitespace-nowrap">
                        <div className="text-base font-mono">৳{Number(ord.total || 0).toLocaleString("en-BD")}</div>
                        <span className="text-[11px] text-emerald-700 font-bold block">
                          Adv Paid: ৳{Number(ord.advancePaid ?? ord.shippingFee ?? 0).toLocaleString("en-BD")}
                        </span>
                        <span className="text-xs text-red-600 font-extrabold block">
                          COD Due: ৳{Number(ord.dueAmount ?? ord.subtotal ?? 0).toLocaleString("en-BD")}
                        </span>
                      </td>

                      {/* 1-Click Status Dropdown */}
                      <td className="p-4">
                        <select
                          value={ord.status}
                          onChange={(e) => handleUpdateStatus(ord.id || ord.orderNumber, e.target.value)}
                          className={`border text-sm rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer font-bold transition-all shadow-2xs ${getStatusBadge(
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

                      {/* Action Buttons */}
                      <td className="p-4 pr-6 text-right space-x-2 whitespace-nowrap">
                        <Link
                          href={`/track?order=${ord.orderNumber}`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl transition-colors text-xs font-bold shadow-2xs"
                          title="View Live Customer Tracking Page"
                        >
                          <Truck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Track</span>
                        </Link>
                        <button
                          onClick={() => setSelectedInvoiceOrder(ord)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl transition-colors text-xs font-bold shadow-2xs"
                          title="View & Print Official VAT Invoice"
                        >
                          <Printer className="w-3.5 h-3.5 text-red-600" />
                          <span>Invoice</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedInvoiceOrder && (
        <InvoiceModal
          order={selectedInvoiceOrder}
          isOpen={!!selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}
    </div>
  );
}
