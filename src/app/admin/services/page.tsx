"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Wrench,
  Search,
  RefreshCw,
  Phone,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Hourglass,
  CheckCircle,
  XCircle,
  Bike,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { formatDateSafe } from "@/lib/formatters";

interface ServiceBookingItem {
  _id: string;
  bookingNumber: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration?: string;
  customerName: string;
  customerPhone: string;
  bikeBrand: string;
  bikeModel: string;
  bikePlate?: string;
  dealershipId: string;
  dealershipName: string;
  dealershipCity: string;
  bookingDate: string;
  bookingSlot: string;
  specialNotes?: string;
  image?: string;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  createdAt: string;
}

export default function AdminServicesManagerPage() {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<ServiceBookingItem[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.append("status", filterStatus);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const res = await fetch(`/api/admin/services?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load bookings");
      const json = await res.json();
      if (json.success && Array.isArray(json.bookings)) {
        setBookings(json.bookings);
      }
    } catch (err: any) {
      showToast("Error", err.message || "Could not retrieve bookings.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [filterStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBookings();
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/admin/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBookings((prev) =>
          prev.map((b) => (b._id === id ? { ...b, status: newStatus as any } : b))
        );
        showToast("Status Updated", `Booking status updated to ${newStatus}.`, "success");
      } else {
        showToast("Update Failed", data.error || "Failed to update status", "error");
      }
    } catch {
      showToast("Error", "Network error updating status", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Hourglass className="w-3.5 h-3.5" /> Pending
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Wrench className="w-3.5 h-3.5" /> In Bay
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" /> Serviced
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-600">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  Workshop Operations
                </span>
                <span className="text-xs text-slate-400 font-semibold">• Service Desk Dispatch</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Workshop & Service Bookings
              </h1>
            </div>
          </div>
          <p className="text-xs text-slate-500 pl-12">
            Manage customer appointment slots, technician bays, status updates, and Telegram bot dispatches.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchBookings}
            disabled={isLoading}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer border border-slate-200 flex items-center gap-2 text-xs font-bold"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-red-600" : ""}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/services"
            target="_blank"
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/20 flex items-center gap-1.5"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Customer Booking Page</span>
          </Link>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Status Tab Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {[
            { id: "all", label: "All Bookings" },
            { id: "pending", label: "Pending" },
            { id: "confirmed", label: "Confirmed" },
            { id: "in_progress", label: "In Bay" },
            { id: "completed", label: "Completed" },
            { id: "cancelled", label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                filterStatus === tab.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative min-w-[280px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search Ticket, Phone, Rider, Bike..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-600 focus:bg-white"
          />
        </form>
      </div>

      {/* Bookings Table / Cards */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading && bookings.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-red-600 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">Loading Workshop Bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Wrench className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">No Service Bookings Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are currently no appointments matching the selected filter. Any booking made on the website will instantly appear here and dispatch to Telegram.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-5">Ticket ID</th>
                  <th className="py-3.5 px-4">Rider / Customer</th>
                  <th className="py-3.5 px-4">Motorcycle</th>
                  <th className="py-3.5 px-4">Package & Charge</th>
                  <th className="py-3.5 px-4">Bay Location & Slot</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {bookings.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Ticket */}
                    <td className="py-4 px-5">
                      <div className="font-mono font-black text-red-600 text-xs">
                        #{b.bookingNumber}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {formatDateSafe(b.createdAt, "en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </td>

                    {/* Rider Contact */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900">{b.customerName}</div>
                      <a
                        href={`tel:${b.customerPhone}`}
                        className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-700 hover:underline mt-0.5"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{b.customerPhone}</span>
                      </a>
                    </td>

                    {/* Motorcycle */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <Bike className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {b.bikeBrand} {b.bikeModel}
                        </span>
                      </div>
                      {b.bikePlate && (
                        <div className="font-mono text-[10px] text-slate-500 mt-0.5">
                          {b.bikePlate}
                        </div>
                      )}
                    </td>

                    {/* Service Package */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900">{b.serviceName}</div>
                      <div className="text-red-600 font-black text-xs mt-0.5">
                        ৳{b.servicePrice.toLocaleString("en-BD")}
                      </div>
                      {b.specialNotes && (
                        <div className="text-[10px] text-amber-700 bg-amber-50 rounded px-1.5 py-0.5 mt-1 border border-amber-200 line-clamp-1 max-w-[200px]">
                          Note: {b.specialNotes}
                        </div>
                      )}
                    </td>

                    {/* Location & Slot */}
                    <td className="py-4 px-4 space-y-1">
                      <div className="flex items-center gap-1 text-slate-700 font-semibold text-[11px]">
                        <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                        <span>{b.dealershipName}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500 text-[10px]">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{b.bookingDate}</span>
                        <span className="text-slate-300">•</span>
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{b.bookingSlot}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">{getStatusBadge(b.status)}</td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <select
                          disabled={updatingId === b._id}
                          value={b.status}
                          onChange={(e) => handleUpdateStatus(b._id, e.target.value)}
                          className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-[11px] font-bold rounded-lg px-2 py-1.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-red-600 disabled:opacity-50"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirm</option>
                          <option value="in_progress">In Bay</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancel</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

