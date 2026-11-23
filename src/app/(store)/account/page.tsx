"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Package,
  MapPin,
  Heart,
  ShieldCheck,
  ChevronRight,
  Clock,
  Truck,
  Wrench,
  Calendar,
  MessageCircle,
  Shield,
  ArrowRight,
} from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import { Order, ServiceBookingItem } from "@/types";

function formatDateSafe(dateVal: any): string {
  if (!dateVal) return new Date().toLocaleDateString("en-GB");
  if (typeof dateVal === "string" && dateVal.includes("/")) return dateVal;
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

export default function AccountOverviewPage() {
  const { wishlist } = useWishlist();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userRole, setUserRole] = useState("");
  const [ordersCount, setOrdersCount] = useState(0);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [recentOrder, setRecentOrder] = useState<Order | null>(null);
  const [recentBooking, setRecentBooking] = useState<ServiceBookingItem | null>(null);

  React.useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [meRes, ordRes] = await Promise.all([
          fetch("/api/auth/me", { cache: "no-store" }),
          fetch("/api/user/orders", { cache: "no-store" }),
        ]);

        if (meRes.ok) {
          const meJson = await meRes.json();
          if (meJson.success && meJson.data?.user) {
            const u = meJson.data.user;
            if (u.name) setUserName(u.name);
            if (u.email) setUserEmail(u.email);
            if (u.phone) setUserPhone(u.phone);
            if (u.role) setUserRole(u.role);
          }
        }

        if (ordRes.ok) {
          const ordJson = await ordRes.json();
          if (ordJson.success) {
            // Product Orders
            if (Array.isArray(ordJson.data?.orders)) {
              setOrdersCount(ordJson.data.orders.length);
              if (ordJson.data.orders.length > 0) {
                const first = ordJson.data.orders[0];
                setRecentOrder({
                  id: first._id?.toString() || first.id || `ord-${Math.random()}`,
                  orderNumber: first.orderNumber || "MPX-ORDER",
                  date: formatDateSafe(first.createdAt || first.date),
                  status: (first.orderStatus || first.status || "Pending") as any,
                  total: Number(first.total ?? first.totalAmount ?? 0),
                  subtotal: Number(first.subtotal ?? 0),
                  shippingFee: Number(first.shippingFee ?? 0),
                  paymentMethod: first.paymentMethod || "Cash on Delivery",
                  paymentStatus: (first.paymentStatus || "Pending") as any,
                  discount: Number(first.discount ?? first.discountAmount ?? 0),
                  deliveryMethod: first.deliveryMethod || "Pathao Express",
                  shippingAddress: {
                    fullName: first.customerInfo?.fullName || first.shippingAddress?.fullName || "Valued Rider",
                    phone: first.customerInfo?.phone || first.shippingAddress?.phone || "",
                    address: first.shippingAddress?.address || first.shippingAddress?.addressLine1 || "Dhaka, Bangladesh",
                    area: first.shippingAddress?.area || "Gulshan",
                    district: first.shippingAddress?.district || "Dhaka",
                    division: first.shippingAddress?.division || "Dhaka",
                  },
                  items: (first.items || []).map((it: any) => ({
                    id: it.productId?.toString() || it.id || "",
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
                  courierName: first.courierInfo?.name || first.courierName || "Pathao",
                  trackingNumber: first.courierInfo?.trackingNumber || first.trackingNumber,
                });
              }
            }

            // Workshop Bookings
            if (Array.isArray(ordJson.data?.bookings)) {
              setBookingsCount(ordJson.data.bookings.length);
              if (ordJson.data.bookings.length > 0) {
                const b = ordJson.data.bookings[0];
                setRecentBooking({
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
                  dealershipName: b.dealershipName || "Motoplex Flagship — Mirpur 60 Feet",
                  dealershipCity: b.dealershipCity || "Dhaka",
                  bookingDate: b.bookingDate || formatDateSafe(b.createdAt),
                  bookingSlot: b.bookingSlot || "11:00 AM – 01:00 PM",
                  specialNotes: b.specialNotes || "",
                  image: b.image || "",
                  status: b.status || "pending",
                  createdAt: b.createdAt,
                });
              }
            }
          }
        }
      } catch {
        // Retain initial values
      }
    };
    fetchUserData();
  }, []);

  return (
    <div className="bg-zinc-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* User Hero Banner */}
        <div className="bg-zinc-950 text-white rounded-3xl p-6 sm:p-8 border border-zinc-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-red-600/20 border-2 border-red-500/40 shrink-0">
              <Image
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop"
                alt={userName || "Motoplex VIP"}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black">{userName || "Motoplex VIP Rider"}</h1>
                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    userRole === "admin"
                      ? "bg-red-600 text-white"
                      : userRole === "moderator"
                      ? "bg-amber-500 text-black font-bold"
                      : "bg-red-600 text-white"
                  }`}
                >
                  {userRole === "admin"
                    ? "Super Administrator"
                    : userRole === "moderator"
                    ? "Workshop Moderator"
                    : "VIP Paddock Tier"}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Member since 2025 • {userEmail || "Signed in account"} {userPhone ? `• ${userPhone}` : ""}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {(userRole === "admin" || userRole === "moderator") && (
              <Link
                href="/admin"
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-black px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Console →</span>
              </Link>
            )}
            <Link
              href="/account/orders"
              className="bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2"
            >
              <Package className="w-3.5 h-3.5 text-zinc-400" />
              <span>Orders ({ordersCount})</span>
            </Link>
            <Link
              href="/account/orders?tab=services"
              className="bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800/80 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2"
            >
              <Wrench className="w-3.5 h-3.5 text-red-400" />
              <span>Workshops ({bookingsCount})</span>
            </Link>
            <Link
              href="/account/profile"
              className="bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
            >
              Edit Profile
            </Link>
          </div>
        </div>

        {/* Staff Privileges Quick Banner (If signed in as Admin or Moderator) */}
        {(userRole === "admin" || userRole === "moderator") && (
          <div className="bg-zinc-950 text-white rounded-3xl p-5 sm:p-6 border border-red-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 shrink-0 font-black text-sm">
                HQ
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">
                  {userRole === "admin"
                    ? "Store Executive Administrator Privileges Active"
                    : "Workshop Operations Moderator Privileges Active"}
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  You are authorized for backend store operations, workshop bookings, customer orders, and POS counter terminals.
                </p>
              </div>
            </div>

            <Link
              href="/admin"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black px-5 py-2.5 rounded-xl transition-all shadow-md shadow-red-600/30 whitespace-nowrap self-start sm:self-auto"
            >
              <span>Open Admin Operations Console</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* 4 Overview Quick Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-white rounded-2xl border border-zinc-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Product Orders
              </span>
              <p className="text-2xl font-black text-zinc-950 mt-1">{ordersCount} Orders</p>
              <Link href="/account/orders" className="text-xs font-semibold text-red-600 hover:underline mt-2 inline-block">
                View All Deliveries →
              </Link>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-zinc-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Workshop Bookings
              </span>
              <p className="text-2xl font-black text-zinc-950 mt-1">{bookingsCount} Reserved</p>
              <Link href="/account/orders?tab=services" className="text-xs font-semibold text-red-600 hover:underline mt-2 inline-block">
                View Bay Appointments →
              </Link>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
              <Wrench className="w-6 h-6" />
            </div>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-zinc-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Wishlist Items
              </span>
              <p className="text-2xl font-black text-zinc-950 mt-1">{wishlist.length} Saved</p>
              <Link href="/wishlist" className="text-xs font-semibold text-red-600 hover:underline mt-2 inline-block">
                Manage Wishlist →
              </Link>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
              <Heart className="w-6 h-6" />
            </div>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-zinc-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Official Warranty
              </span>
              <p className="text-2xl font-black text-emerald-600 mt-1">Certified</p>
              <span className="text-xs text-zinc-500 mt-1 block">Aprilia & Vespa Valid</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Workshop Service Spotlight (If Customer has booked bike service) */}
        {recentBooking && (
          <div className="p-6 sm:p-8 bg-gradient-to-br from-zinc-950 to-zinc-900 text-white rounded-3xl border border-zinc-800 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-3">
              <div>
                <span className="text-xs font-black text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5" /> Upcoming Workshop Service Bay
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  Ticket #{recentBooking.bookingNumber} • {recentBooking.serviceName}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 uppercase">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  {recentBooking.status}
                </span>
                <Link
                  href="/account/orders?tab=services"
                  className="text-xs font-bold text-zinc-300 hover:text-white underline"
                >
                  Bay Details →
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 space-y-1">
                <span className="text-[10px] text-zinc-400 font-bold uppercase block">Scheduled Bay Slot</span>
                <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                  <Calendar className="w-4 h-4 text-red-500" />
                  <span>{recentBooking.bookingDate}</span>
                </div>
                <p className="text-zinc-400 text-xs">{recentBooking.bookingSlot}</p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 space-y-1">
                <span className="text-[10px] text-zinc-400 font-bold uppercase block">Motorcycle Spec</span>
                <div className="font-bold text-white text-sm">
                  🏍️ {recentBooking.bikeBrand} {recentBooking.bikeModel}
                </div>
                <p className="text-zinc-400 font-mono text-xs">
                  {recentBooking.bikePlate || "Plate Not Registered"}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 space-y-1">
                <span className="text-[10px] text-zinc-400 font-bold uppercase block">Service Dealership</span>
                <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                  <MapPin className="w-4 h-4 text-red-500" />
                  <span>{recentBooking.dealershipName}</span>
                </div>
                <p className="text-zinc-400 text-xs">{recentBooking.dealershipCity}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="text-xs text-zinc-400">
                Estimated Service Fee: <strong className="text-white text-sm">৳{recentBooking.servicePrice.toLocaleString("en-BD")}</strong> (Payable at showroom)
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`https://wa.me/8801957060531?text=${encodeURIComponent(`Hello Motoplex Showroom, checking on my service ticket #${recentBooking.bookingNumber} for ${recentBooking.bikeBrand} ${recentBooking.bikeModel}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Showroom</span>
                </a>
                <Link
                  href="/account/orders?tab=services"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  <span>All Bookings ({bookingsCount})</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Recent Product Order Spotlight */}
        {recentOrder ? (
          <div className="p-6 sm:p-8 bg-white rounded-3xl border border-zinc-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-100 gap-2">
              <div>
                <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
                  Most Recent Product Order
                </span>
                <h3 className="text-lg font-bold text-zinc-950 mt-0.5">
                  #{recentOrder.orderNumber} • Placed on {recentOrder.date}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  <Clock className="w-3.5 h-3.5" />
                  {recentOrder.status}
                </span>
                <Link
                  href="/account/orders"
                  className="text-xs font-bold text-zinc-700 hover:text-red-600 underline"
                >
                  Order Details
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              {(recentOrder.items || []).map((it: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-white shrink-0 border border-zinc-200">
                      <Image src={it.productImage || "/images/products/aprilia-rs660-1.png"} alt="" fill className="object-cover" />
                    </div>
                    <div className="text-xs">
                      <h4 className="font-bold text-zinc-900">{it.productName}</h4>
                      <p className="text-[11px] text-zinc-500">{it.variantInfo} • Qty: {it.quantity}</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-zinc-950">
                    ৳{Number(it.total || 0).toLocaleString("en-BD")}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-zinc-700">
                <Truck className="w-4 h-4 text-red-600" />
                <span>
                  Courier: <strong>{recentOrder.courierName || "Express Courier"}</strong>
                  {recentOrder.trackingNumber && (
                    <> • Tracking Code: <strong className="font-mono text-zinc-900">{recentOrder.trackingNumber}</strong></>
                  )}
                </span>
              </div>
              <span className="font-bold text-zinc-950">
                Total Order: ৳{Number(recentOrder.total || 0).toLocaleString("en-BD")}
              </span>
            </div>
          </div>
        ) : !recentBooking ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-zinc-200 shadow-xs space-y-3">
            <Package className="w-10 h-10 text-zinc-300 mx-auto" />
            <h3 className="text-sm font-bold text-zinc-900">No active activity found</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              You haven&apos;t placed any orders or booked motorcycle services yet. Explore our genuine parts or schedule certified workshop maintenance.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Link
                href="/shop"
                className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-colors shadow-xs"
              >
                Browse Catalog
              </Link>
              <Link
                href="/services"
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-colors shadow-xs"
              >
                Book Bike Service
              </Link>
            </div>
          </div>
        ) : null}

        {/* Addresses & Navigation Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Default Address */}
          <div className="p-6 bg-white rounded-3xl border border-zinc-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-600" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-900">
                  Default Shipping Address
                </h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Primary
              </span>
            </div>
            <div className="text-xs text-zinc-600 space-y-1">
              <p className="font-bold text-zinc-900 text-sm">{userName || "Customer Profile"}</p>
              <p>{userEmail || "Signed in account"}</p>
              <p className="text-zinc-500 font-mono pt-1">{userPhone || "Contact number can be set in Profile"}</p>
            </div>
            <Link
              href="/account/addresses"
              className="text-xs font-bold text-red-600 hover:underline inline-block pt-1"
            >
              Manage Saved Addresses →
            </Link>
          </div>

          {/* Quick Account Links */}
          <div className="p-6 bg-white rounded-3xl border border-zinc-200 shadow-xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-900 pb-3 border-b border-zinc-100">
              Account Shortcuts
            </h3>
            <div className="divide-y divide-zinc-100 text-xs">
              <Link href="/account/orders" className="flex items-center justify-between py-2.5 hover:text-red-600">
                <span>View Product Orders & Courier Invoices</span>
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </Link>
              <Link href="/account/orders?tab=services" className="flex items-center justify-between py-2.5 hover:text-red-600">
                <span>View Workshop Service Bay Appointments</span>
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </Link>
              <Link href="/account/profile" className="flex items-center justify-between py-2.5 hover:text-red-600">
                <span>Security & Password Settings</span>
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </Link>
              <Link href="/wishlist" className="flex items-center justify-between py-2.5 hover:text-red-600">
                <span>Saved Wishlist ({wishlist.length} Items)</span>
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </Link>
              <Link href="/contact" className="flex items-center justify-between py-2.5 hover:text-red-600">
                <span>Contact Dedicated VIP Concierge</span>
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
