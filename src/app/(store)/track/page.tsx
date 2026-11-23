"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Search,
  Truck,
  CheckCircle2,
  Package,
  MapPin,
  Phone,
  ShieldCheck,
  ExternalLink,
  Printer,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { InvoiceModal } from "@/components/ui/InvoiceModal";
import { Order } from "@/types";

interface TimelineStep {
  title: string;
  titleBn: string;
  description: string;
  completed: boolean;
  current: boolean;
  time: string;
}

function TrackingContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("order") || searchParams.get("q") || searchParams.get("phone") || "";

  const [query, setQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<Order | null>(null);
  const [timeline, setTimeline] = useState<TimelineStep[]>([]);
  const [courierDirectUrl, setCourierDirectUrl] = useState<string>("");
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const fetchTracking = async (searchTarget: string) => {
    if (!searchTarget.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/track?q=${encodeURIComponent(searchTarget.trim())}`);
      const json = await res.json();

      if (res.ok && json.success) {
        setOrderData(json.data.order);
        setTimeline(json.data.timeline || []);
        setCourierDirectUrl(json.data.courierDirectUrl || "");
      } else {
        setError(json.message || "No order found matching your query. Please check your order ID or phone number.");
        setOrderData(null);
      }
    } catch {
      setError("Unable to connect to tracking servers. Please try again.");
      setOrderData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      fetchTracking(initialQuery);
    }
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTracking(query);
  };

  return (
    <div className="bg-zinc-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Page Title & Search Bar */}
        <div className="text-center space-y-3">
          <span className="text-[11px] font-bold text-red-600 uppercase tracking-widest bg-red-50 border border-red-200/80 px-3 py-1 rounded-full inline-block">
            Motoplex Live Courier Tracking
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight">
            TRACK YOUR SHIPMENT LIVE
          </h1>
          <p className="text-xs text-zinc-600 max-w-lg mx-auto leading-relaxed">
            আপনার অর্ডার নম্বর (<strong className="text-zinc-900">MPX-XXXX</strong>) অথবা অর্ডারে ব্যবহৃত{" "}
            <strong className="text-zinc-900">মোবাইল নম্বর</strong> দিয়ে পার্সেলের বর্তমান অবস্থান রিয়েল-টাইমে ট্র্যাক করুন।
          </p>

          {/* Search Box */}
          <form onSubmit={handleSubmit} className="pt-2 max-w-xl mx-auto flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-3.5" />
              <input
                type="text"
                required
                placeholder="Enter Order # (e.g. MPX-MWKT...) or Phone Number..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-600 shadow-xs"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-6 py-3 rounded-2xl transition-all shadow-md shadow-red-600/20 flex items-center gap-2 shrink-0 disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Truck className="w-4 h-4" />
                  <span>Track Order</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-red-800 text-xs max-w-xl mx-auto">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <p>{error}</p>
          </div>
        )}

        {/* Live Tracking Result Details */}
        {orderData && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Order Overview Banner */}
            <div className="bg-white rounded-3xl border border-zinc-200/90 p-6 sm:p-7 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase block">Official Order Ref</span>
                  <strong className="text-xl font-black text-red-600 font-mono tracking-tight">
                    {orderData.orderNumber}
                  </strong>
                  <span className="text-zinc-500 block mt-0.5">Placed on {orderData.date}</span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                      orderData.status === "Delivered"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : orderData.status === "Shipped"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : orderData.status === "Processing" || orderData.status === "Confirmed"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    ● {orderData.status}
                  </span>

                  <button
                    onClick={() => setIsInvoiceOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl transition-colors text-xs font-semibold"
                  >
                    <Printer className="w-3.5 h-3.5 text-red-600" />
                    <span>Print Invoice</span>
                  </button>
                </div>
              </div>

              {/* Delivery & Courier Partner Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 text-xs">
                <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200/80 space-y-1">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase block flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-red-600" /> Courier Partner
                  </span>
                  <strong className="text-sm font-bold text-zinc-950 block">
                    {orderData.courierName || "Pathao"} Express
                  </strong>
                  <span className="text-[11px] text-zinc-500 font-mono block">
                    Consignment: {orderData.trackingNumber || "PTH-PENDING"}
                  </span>
                  {courierDirectUrl && (
                    <a
                      href={courierDirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-600 hover:underline font-bold text-[11px] inline-flex items-center gap-1 pt-1"
                    >
                      <span>Track on Courier Website</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200/80 space-y-1">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase block flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500" /> Delivery Location
                  </span>
                  <strong className="text-zinc-900 block truncate">
                    {orderData.shippingAddress.fullName}
                  </strong>
                  <span className="text-zinc-600 block line-clamp-2 text-[11px]">
                    {orderData.shippingAddress.address}, {orderData.shippingAddress.area ? `${orderData.shippingAddress.area}, ` : ""}{orderData.shippingAddress.district}
                  </span>
                  <span className="text-zinc-500 text-[10px] block font-mono">
                    Phone: {orderData.shippingAddress.phone}
                  </span>
                </div>

                <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200/80 space-y-1">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase block flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Payment & Total
                  </span>
                  <strong className="text-sm font-black text-zinc-950 block">
                    ৳{Number(orderData.total || 0).toLocaleString("en-BD")}
                  </strong>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md inline-block">
                    {orderData.paymentMethod} (COD)
                  </span>
                  <p className="text-[10px] text-zinc-500 pt-0.5">
                    Pay cash upon delivery after opening parcel
                  </p>
                </div>
              </div>
            </div>

            {/* Visual Real-Time Shipment Progress Timeline */}
            <div className="bg-white rounded-3xl border border-zinc-200/90 p-6 sm:p-7 shadow-xs space-y-6">
              <div>
                <h3 className="text-sm font-black text-zinc-950 uppercase tracking-wider">
                  Live Dispatch Milestones
                </h3>
                <p className="text-xs text-zinc-500">পার্সেলের বর্তমান স্ট্যাটাস ও প্রতিটি ধাপের আপডেট</p>
              </div>

              <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-zinc-200">
                {timeline.map((step, idx) => (
                  <div key={idx} className="relative flex items-start gap-4 text-xs">
                    {/* Step Icon */}
                    <span
                      className={`absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white ${
                        step.completed
                          ? "bg-emerald-600 text-white"
                          : step.current
                          ? "bg-red-600 text-white animate-pulse"
                          : "bg-zinc-200 text-zinc-500"
                      }`}
                    >
                      {step.completed ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h4
                          className={`font-black text-sm ${
                            step.completed || step.current ? "text-zinc-900" : "text-zinc-400"
                          }`}
                        >
                          {step.title} <span className="text-zinc-400 font-normal text-xs font-sans">({step.titleBn})</span>
                        </h4>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                            step.current
                              ? "bg-red-50 text-red-600 font-bold border border-red-200"
                              : step.completed
                              ? "text-emerald-700 bg-emerald-50"
                              : "text-zinc-400"
                          }`}
                        >
                          {step.time}
                        </span>
                      </div>
                      <p className="text-zinc-500 text-xs mt-1 leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ordered Parts Details */}
            <div className="bg-white rounded-3xl border border-zinc-200/90 p-6 sm:p-7 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-zinc-950 uppercase tracking-wider pb-3 border-b border-zinc-100">
                Order Items ({orderData.items.length})
              </h3>

              <div className="divide-y divide-zinc-100">
                {(orderData.items || []).map((it, idx) => (
                  <div key={idx} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-zinc-100 shrink-0 border border-zinc-200">
                        {it.productImage ? (
                          <Image src={it.productImage} alt="" fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-400">
                            <Package className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-900 leading-snug">{it.productName}</h4>
                        <span className="text-[11px] text-zinc-500">
                          {it.variantInfo} • Qty: {it.quantity}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <strong className="text-zinc-950 text-sm block">
                        ৳{Number(it.total || (it.price * it.quantity) || 0).toLocaleString("en-BD")}
                      </strong>
                      <span className="text-[10px] text-zinc-400">
                        ৳{Number(it.price || 0).toLocaleString("en-BD")} / unit
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Need Help Card */}
            <div className="bg-zinc-900 text-white rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider block">
                  Official Motoplex Rider Care
                </span>
                <h4 className="text-base font-bold">Have Questions About Your Delivery?</h4>
                <p className="text-xs text-zinc-400">
                  Our Gulshan logistics desk is ready to assist your dispatch status Saturday - Thursday.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <a
                  href="tel:+8801700668675"
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md flex items-center gap-2"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call +880 1700-MOTOPLEX</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Modal */}
        {orderData && (
          <InvoiceModal
            order={orderData}
            isOpen={isInvoiceOpen}
            onClose={() => setIsInvoiceOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <TrackingContent />
    </Suspense>
  );
}

