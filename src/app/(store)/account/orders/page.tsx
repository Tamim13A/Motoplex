"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Truck,
  ArrowLeft,
  Printer,
  Package,
  Wrench,
  Clock,
  Calendar,
  MapPin,
  Phone,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { InvoiceModal } from "@/components/ui/InvoiceModal";
import { Order, ServiceBookingItem } from "@/types";

function formatDateSafe(dateVal: any): string {
  if (!dateVal) return new Date().toLocaleDateString("en-GB");
  if (typeof dateVal === "string" && dateVal.includes("/")) {
    return dateVal;
  }
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return new Date().toLocaleDateString("en-GB");
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return new Date().toLocaleDateString("en-GB");
  }
}

function getStatusBadgeClass(statusStr: string): string {
  const s = String(statusStr || "Pending").toLowerCase();
  if (s === "delivered") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (s === "shipped") return "bg-purple-50 text-purple-700 border-purple-200";
  if (s === "processing" || s === "confirmed") return "bg-blue-50 text-blue-700 border-blue-200";
  if (s === "cancelled") return "bg-red-50 text-red-700 border-red-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

function getServiceStatusBadge(statusStr: string) {
  const s = String(statusStr || "pending").toLowerCase();
  if (s === "completed") {
    return {
      label: "Service Completed",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dot: "bg-emerald-500",
    };
  }
  if (s === "in_progress") {
    return {
      label: "In Service Bay",
      className: "bg-blue-50 text-blue-700 border-blue-200",
      dot: "bg-blue-500 animate-pulse",
    };
  }
  if (s === "confirmed") {
    return {
      label: "Bay Confirmed",
      className: "bg-purple-50 text-purple-700 border-purple-200",
      dot: "bg-purple-500",
    };
  }
  if (s === "cancelled") {
    return {
      label: "Cancelled",
      className: "bg-red-50 text-red-700 border-red-200",
      dot: "bg-red-500",
    };
  }
  return {
    label: "Pending Confirmation",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500 animate-pulse",
  };
}

export default function AccountOrdersPage() {
  const [activeTab, setActiveTab] = useState<"orders" | "services">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<ServiceBookingItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [serviceFilterStatus, setServiceFilterStatus] = useState<string>("all");
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if query string asks for workshop services
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "services") {
        setActiveTab("services");
      }
    }

    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/user/orders");
        if (!res.ok) return;
        const json = await res.json();

        // 1. Map Product Orders
        if (json.success && Array.isArray(json.data?.orders)) {
          const mappedOrders: Order[] = json.data.orders.map((o: any) => ({
            id: o._id?.toString() || o.id || `ord-${Math.random()}`,
            orderNumber: o.orderNumber || "MPX-ORDER",
            date: formatDateSafe(o.createdAt || o.date),
            status: (o.orderStatus || o.status || "Pending") as any,
            total: Number(o.total ?? o.totalAmount ?? 0),
            subtotal: Number(o.subtotal ?? 0),
            shippingFee: Number(o.shippingFee ?? 0),
            advancePaid: Number(o.advancePaid ?? o.shippingFee ?? 0),
            dueAmount: Number(o.dueAmount ?? o.subtotal ?? 0),
            paymentMethod: o.paymentMethod || "Cash on Delivery",
            paymentStatus: (o.paymentStatus || "Pending") as any,
            discount: Number(o.discount ?? o.discountAmount ?? 0),
            deliveryMethod: o.deliveryMethod || "Pathao Express",
            shippingAddress: {
              fullName: o.customerInfo?.fullName || o.shippingAddress?.fullName || "Valued Rider",
              phone: o.customerInfo?.phone || o.shippingAddress?.phone || "017XXXXXXXX",
              address: o.shippingAddress?.address || o.shippingAddress?.addressLine1 || "Dhaka, Bangladesh",
              area: o.shippingAddress?.area || "Gulshan",
              district: o.shippingAddress?.district || "Dhaka",
              division: o.shippingAddress?.division || "Dhaka",
            },
            items: (o.items || []).map((it: any) => ({
              id: it.productId?.toString() || it.id || `it-${Math.random()}`,
              productId: it.productId?.toString() || "",
              productName: it.name || it.productName || "Genuine Motorcycle Part",
              productImage:
                it.image ||
                it.productImage ||
                "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=300&auto=format&fit=crop",
              variantInfo: it.variantDetails?.size || it.variantSku || it.variantInfo || "Standard Spec",
              price: Number(it.price) || 0,
              quantity: Number(it.quantity) || 1,
              total: Number(it.total) || ((Number(it.price) || 0) * (Number(it.quantity) || 1)),
            })),
            courierName: o.courierInfo?.name || o.courierName || "Pathao",
            trackingNumber: o.courierInfo?.trackingNumber || o.trackingNumber,
          }));
          setOrders(mappedOrders);
        }

        // 2. Map Workshop Service Bookings
        if (json.success && Array.isArray(json.data?.bookings)) {
          const mappedBookings: ServiceBookingItem[] = json.data.bookings.map((b: any) => ({
            id: b._id?.toString() || b.id || `srv-${Math.random()}`,
            bookingNumber: b.bookingNumber || "MPX-SRV",
            serviceId: b.serviceId || "srv-master",
            serviceName: b.serviceName || "Official Workshop Service",
            servicePrice: Number(b.servicePrice) || 0,
            serviceDuration: b.serviceDuration || "2 - 4 Hours",
            customerName: b.customerName || "Rider",
            customerPhone: b.customerPhone || "",
            customerEmail: b.customerEmail || "",
            bikeBrand: b.bikeBrand || "Aprilia",
            bikeModel: b.bikeModel || "RS 457",
            bikePlate: b.bikePlate || "",
            dealershipId: b.dealershipId || "dealership-gulshan",
            dealershipName: b.dealershipName || "Motoplex Gulshan HQ",
            dealershipCity: b.dealershipCity || "Dhaka",
            bookingDate: b.bookingDate || formatDateSafe(b.createdAt),
            bookingSlot: b.bookingSlot || "11:00 AM – 01:00 PM",
            specialNotes: b.specialNotes || "",
            image: b.image || "",
            status: b.status || "pending",
            createdAt: b.createdAt,
          }));
          setBookings(mappedBookings);
        }
      } catch (err) {
        console.warn("[AccountOrders] Error loading activity:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, []);

  // Filter Product Orders
  const filteredOrders = orders.filter((order) => {
    if (filterStatus === "all") return true;
    const st = String(order.status).toLowerCase();
    if (filterStatus === "active") return ["processing", "pending", "shipped", "confirmed"].includes(st);
    if (filterStatus === "completed") return st === "delivered";
    return true;
  });

  const activeOrdersCount = orders.filter((o) =>
    ["processing", "pending", "shipped", "confirmed"].includes(String(o.status).toLowerCase())
  ).length;

  const deliveredOrdersCount = orders.filter(
    (o) => String(o.status).toLowerCase() === "delivered"
  ).length;

  // Filter Workshop Bookings
  const filteredBookings = bookings.filter((booking) => {
    if (serviceFilterStatus === "all") return true;
    const st = String(booking.status).toLowerCase();
    if (serviceFilterStatus === "active") return ["pending", "confirmed", "in_progress"].includes(st);
    if (serviceFilterStatus === "completed") return st === "completed";
    return true;
  });

  const activeBookingsCount = bookings.filter((b) =>
    ["pending", "confirmed", "in_progress"].includes(String(b.status).toLowerCase())
  ).length;

  const completedBookingsCount = bookings.filter(
    (b) => String(b.status).toLowerCase() === "completed"
  ).length;

  return (
    <div className="bg-zinc-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Back Link & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
          <div>
            <Link
              href="/account"
              className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 flex items-center gap-1 mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard Overview
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
                ACTIVITY & BOOKINGS HISTORY
              </h1>
              {isLoading && (
                <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" /> Syncing
                </span>
              )}
            </div>
          </div>

          {/* Tab Selector: Orders vs Workshop Services */}
          <div className="flex items-center gap-2 bg-zinc-200/80 p-1 rounded-2xl border border-zinc-300/80 text-xs font-bold">
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === "orders"
                  ? "bg-zinc-950 text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-950"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Product Orders</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === "orders" ? "bg-red-600 text-white" : "bg-zinc-300 text-zinc-700"
                }`}
              >
                {orders.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("services")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === "services"
                  ? "bg-red-600 text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-950"
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Workshop Bookings</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === "services" ? "bg-white text-red-600" : "bg-zinc-300 text-zinc-700"
                }`}
              >
                {bookings.length}
              </span>
            </button>
          </div>
        </div>

        {/* ===================== TAB 1: PRODUCT ORDERS ===================== */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            {/* Filter Status Tabs */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-zinc-200 shadow-xs text-xs font-bold">
                <button
                  onClick={() => setFilterStatus("all")}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    filterStatus === "all" ? "bg-zinc-950 text-white" : "text-zinc-600 hover:text-zinc-950"
                  }`}
                >
                  All ({orders.length})
                </button>
                <button
                  onClick={() => setFilterStatus("active")}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    filterStatus === "active" ? "bg-zinc-950 text-white" : "text-zinc-600 hover:text-zinc-950"
                  }`}
                >
                  Active Shipments ({activeOrdersCount})
                </button>
                <button
                  onClick={() => setFilterStatus("completed")}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    filterStatus === "completed" ? "bg-zinc-950 text-white" : "text-zinc-600 hover:text-zinc-950"
                  }`}
                >
                  Delivered ({deliveredOrdersCount})
                </button>
              </div>

              <span className="text-xs text-zinc-400 font-medium hidden sm:inline">
                Showing {filteredOrders.length} order{filteredOrders.length === 1 ? "" : "s"}
              </span>
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-3xl border border-zinc-200 p-12 sm:p-16 text-center space-y-4 shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
                  <Package className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900">No Product Orders Found</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  {filterStatus === "all"
                    ? "You haven't placed any product orders yet. Explore our genuine racing motorcycle parts catalog."
                    : `There are currently no orders with '${filterStatus}' status.`}
                </p>
                <Link
                  href="/shop"
                  className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-md shadow-red-600/20"
                >
                  Browse Genuine Parts
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredOrders.map((order) => {
                  const statusClass = getStatusBadgeClass(order.status);

                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-3xl border border-zinc-200 shadow-xs overflow-hidden"
                    >
                      {/* Order Top Bar */}
                      <div className="bg-zinc-50/80 p-5 sm:px-6 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 text-xs">
                        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                          <div>
                            <span className="text-[10px] text-zinc-400 font-bold uppercase block">Order Placed</span>
                            <strong className="text-zinc-900">{order.date}</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-400 font-bold uppercase block">Order Number</span>
                            <strong className="font-mono text-red-600">#{order.orderNumber}</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-400 font-bold uppercase block">Recipient</span>
                            <strong className="text-zinc-900">{order.shippingAddress.fullName}</strong>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full font-bold uppercase tracking-wider text-[11px] border ${statusClass}`}
                          >
                            {order.status}
                          </span>
                          <Link
                            href={`/track?order=${order.orderNumber}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg transition-colors text-xs font-semibold"
                          >
                            <Truck className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Live Track</span>
                          </Link>
                          <button
                            onClick={() => setSelectedInvoiceOrder(order)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-950 rounded-lg transition-colors text-xs font-semibold cursor-pointer"
                            title="Download or Print Official VAT Invoice"
                          >
                            <Printer className="w-3.5 h-3.5 text-red-600" />
                            <span>Invoice</span>
                          </button>
                        </div>
                      </div>

                      {/* Items in Order */}
                      <div className="p-6 divide-y divide-zinc-100">
                        {order.items.map((it, idx) => (
                          <div
                            key={idx}
                            className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-4">
                              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-zinc-100 shrink-0 border border-zinc-200">
                                <Image
                                  src={it.productImage}
                                  alt={it.productName}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="space-y-1 text-xs">
                                <h4 className="font-bold text-zinc-900 text-sm leading-snug">
                                  {it.productName}
                                </h4>
                                <p className="text-zinc-500">
                                  {it.variantInfo} • Qty: {it.quantity}
                                </p>
                                <span className="font-mono text-zinc-700 font-bold sm:hidden block">
                                  ৳{(it.total || 0).toLocaleString("en-BD")}
                                </span>
                              </div>
                            </div>

                            <div className="text-right hidden sm:block">
                              <span className="font-black text-sm text-zinc-950 block">
                                ৳{(it.total || 0).toLocaleString("en-BD")}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-medium">
                                ৳{(it.price || 0).toLocaleString("en-BD")} / unit
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Tracking & Payment Footer Bar */}
                      <div className="bg-zinc-50 p-5 px-6 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 font-medium text-zinc-700">
                            <Truck className="w-4 h-4 text-red-600" />
                            <span>
                              Delivery: <strong>{order.deliveryMethod}</strong>
                              {order.trackingNumber && (
                                <>
                                  {" "}• Tracking Code:{" "}
                                  <strong className="font-mono text-zinc-900">{order.trackingNumber}</strong>
                                </>
                              )}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500">
                            Address: {order.shippingAddress.address}, {order.shippingAddress.area},{" "}
                            {order.shippingAddress.district}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 self-end sm:self-auto">
                          <div className="text-right">
                            <span className="text-[10px] text-zinc-400 block uppercase font-bold">
                              Total ({order.paymentMethod})
                            </span>
                            <span className="font-black text-base text-zinc-950">
                              ৳{(order.total || 0).toLocaleString("en-BD")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 2: WORKSHOP BOOKINGS ===================== */}
        {activeTab === "services" && (
          <div className="space-y-6">
            {/* Filter Status Tabs */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-zinc-200 shadow-xs text-xs font-bold">
                <button
                  onClick={() => setServiceFilterStatus("all")}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    serviceFilterStatus === "all" ? "bg-zinc-950 text-white" : "text-zinc-600 hover:text-zinc-950"
                  }`}
                >
                  All Bookings ({bookings.length})
                </button>
                <button
                  onClick={() => setServiceFilterStatus("active")}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    serviceFilterStatus === "active" ? "bg-zinc-950 text-white" : "text-zinc-600 hover:text-zinc-950"
                  }`}
                >
                  Upcoming & Active ({activeBookingsCount})
                </button>
                <button
                  onClick={() => setServiceFilterStatus("completed")}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    serviceFilterStatus === "completed" ? "bg-zinc-950 text-white" : "text-zinc-600 hover:text-zinc-950"
                  }`}
                >
                  Completed ({completedBookingsCount})
                </button>
              </div>

              <Link
                href="/services"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700"
              >
                <Wrench className="w-3.5 h-3.5" /> Book Another Bay Appointment →
              </Link>
            </div>

            {/* Bookings List */}
            {filteredBookings.length === 0 ? (
              <div className="bg-white rounded-3xl border border-zinc-200 p-12 sm:p-16 text-center space-y-4 shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto text-red-600">
                  <Wrench className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900">No Workshop Bookings Found</h3>
                <p className="text-xs text-zinc-500 max-w-md mx-auto">
                  {serviceFilterStatus === "all"
                    ? "You haven't booked any official motorcycle workshop appointments yet. Schedule certified engine tuning, periodic service, or track diagnostics."
                    : `There are currently no service appointments with '${serviceFilterStatus}' status.`}
                </p>
                <Link
                  href="/services"
                  className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-md shadow-red-600/20"
                >
                  Book Official Master Service Bay
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredBookings.map((booking) => {
                  const badge = getServiceStatusBadge(booking.status);
                  const whatsappMsg = `Hello Motoplex Bangladesh Showroom, inquiring about my motorcycle service ticket #${booking.bookingNumber} for ${booking.bikeBrand} ${booking.bikeModel} scheduled on ${booking.bookingDate} (${booking.bookingSlot}).`;
                  const whatsappUrl = `https://wa.me/8801957060531?text=${encodeURIComponent(whatsappMsg)}`;

                  return (
                    <div
                      key={booking.id}
                      className="bg-white rounded-3xl border border-zinc-200 shadow-xs overflow-hidden transition-all hover:border-zinc-300"
                    >
                      {/* Booking Top Bar */}
                      <div className="bg-zinc-50/90 p-5 sm:px-6 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 text-xs">
                        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                          <div>
                            <span className="text-[10px] text-zinc-400 font-bold uppercase block">
                              Service Ticket ID
                            </span>
                            <strong className="font-mono text-red-600 font-black">
                              #{booking.bookingNumber}
                            </strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-400 font-bold uppercase block">
                              Scheduled Date & Slot
                            </span>
                            <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                              <span>{booking.bookingDate}</span>
                              <span className="text-zinc-400">•</span>
                              <Clock className="w-3.5 h-3.5 text-zinc-500" />
                              <span>{booking.bookingSlot}</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-400 font-bold uppercase block">
                              Workshop Dealership
                            </span>
                            <strong className="text-zinc-900 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-red-600" />
                              {booking.dealershipName} ({booking.dealershipCity})
                            </strong>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold uppercase tracking-wider text-[11px] border ${badge.className}`}
                          >
                            <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                            {badge.label}
                          </span>
                        </div>
                      </div>

                      {/* Main Service Details Body */}
                      <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-zinc-950 text-white flex items-center justify-center shrink-0 border border-zinc-800 shadow-xs">
                            <Wrench className="w-7 h-7 text-red-500" />
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="bg-red-50 text-red-700 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-red-200">
                                Certified Workshop Bay
                              </span>
                              <span className="text-xs text-zinc-500">
                                Duration: <strong>{booking.serviceDuration || "2 - 4 Hours"}</strong>
                              </span>
                            </div>

                            <h3 className="text-lg font-black text-zinc-950">
                              {booking.serviceName}
                            </h3>

                            {/* Bike Specs */}
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="bg-zinc-100 text-zinc-800 font-bold px-2.5 py-1 rounded-lg border border-zinc-200">
                                🏍️ {booking.bikeBrand} {booking.bikeModel}
                              </span>
                              {booking.bikePlate && (
                                <span className="bg-zinc-100 text-zinc-700 font-mono text-[11px] px-2.5 py-1 rounded-lg border border-zinc-200">
                                  Plate: {booking.bikePlate}
                                </span>
                              )}
                            </div>

                            {booking.specialNotes && (
                              <p className="text-xs text-zinc-600 bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 mt-2 max-w-xl">
                                <span className="font-bold text-amber-900">Rider Note:</span>{" "}
                                {booking.specialNotes}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Price & Primary Contact Action */}
                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 pt-4 md:pt-0 border-zinc-100 shrink-0">
                          <div className="text-left md:text-right">
                            <span className="text-[10px] text-zinc-400 block uppercase font-bold">
                              Estimated Service Fee
                            </span>
                            <span className="font-black text-xl text-zinc-950">
                              ৳{booking.servicePrice.toLocaleString("en-BD")}
                            </span>
                            <span className="text-[10px] text-zinc-400 block">
                              Pay at showroom counter
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions & Direct Admin WhatsApp */}
                      <div className="bg-zinc-50 p-4 px-6 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 text-zinc-600">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>
                            Official Motoplex Bay Slot reserved for{" "}
                            <strong>{booking.customerName}</strong> ({booking.customerPhone})
                          </span>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors font-bold text-xs shadow-xs"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp Workshop Admin</span>
                          </a>

                          <a
                            href="tel:+8801957060531"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-xl transition-colors font-bold text-xs"
                          >
                            <Phone className="w-3.5 h-3.5 text-zinc-700" />
                            <span>Call Hotline</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
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
