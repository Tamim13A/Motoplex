"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Star, CheckCircle2, XCircle, Filter } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { formatDateSafe } from "@/lib/formatters";

interface ReviewItem {
  id: string;
  userName: string;
  userCity?: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  image?: string;
  status: "pending" | "approved" | "rejected";
  productName?: string;
}

interface ReviewApiItem {
  _id?: string;
  id?: string;
  userName?: string;
  userCity?: string;
  rating: number;
  createdAt?: string;
  title: string;
  comment: string;
  images?: string[];
  image?: string;
  status: "pending" | "approved" | "rejected";
  productName?: string;
}

export default function AdminReviewsPage() {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);

  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  useEffect(() => {
    const fetchLiveReviews = async () => {
      try {
        const res = await fetch("/api/admin/reviews?status=all");
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && Array.isArray(json.data?.reviews) && json.data.reviews.length > 0) {
          const mapped: ReviewItem[] = json.data.reviews.map((r: ReviewApiItem) => ({
            id: r._id?.toString() || r.id || `rev-${Math.random().toString(36).slice(2, 9)}`,
            userName: r.userName || "Customer Rider",
            userCity: r.userCity || "Bangladesh",
            rating: r.rating,
            date: formatDateSafe(r.createdAt, "en-BD"),
            title: r.title,
            comment: r.comment,
            image: r.images?.[0] || r.image,
            status: r.status,
            productName: r.productName || "Catalog Product",
          }));
          setReviews(mapped);
        }
      } catch {
        // Fallback to initial mock reviews
      }
    };
    fetchLiveReviews();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: "approved" | "rejected") => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );

    showToast(
      newStatus === "approved" ? "Review Approved" : "Review Rejected",
      `Customer review marked as ${newStatus}.`,
      newStatus === "approved" ? "success" : "info"
    );

    try {
      await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      // Optimistic state retained
    }
  };

  const filtered = reviews.filter((r) => {
    if (filterStatus === "all") return true;
    return r.status === filterStatus;
  });

  const pendingCount = reviews.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard Overview
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              CUSTOMER REVIEWS MODERATION
            </h1>
            {pendingCount > 0 && (
              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-extrabold px-3 py-1 rounded-full animate-pulse">
                {pendingCount} Pending Approval
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Review customer ratings, rider photos, and feedback before making them public on product pages.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs shadow-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          {(["pending", "approved", "rejected", "all"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3.5 py-1.5 rounded-xl font-bold capitalize transition-all ${
                filterStatus === st
                  ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                  : "bg-slate-100 text-slate-700 hover:text-slate-950 border border-slate-200"
              }`}
            >
              {st} {st === "pending" && `(${pendingCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 text-sm shadow-xs">
            No reviews found in &ldquo;{filterStatus}&rdquo; status.
          </div>
        ) : (
          filtered.map((rev) => (
            <div
              key={rev.id}
              className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-200">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-base text-slate-950">{rev.userName}</span>
                    {rev.userCity && (
                      <span className="text-xs text-slate-500 font-medium">• {rev.userCity}</span>
                    )}
                    <span
                      className={`text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                        rev.status === "approved"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold"
                          : rev.status === "pending"
                          ? "bg-amber-100 text-amber-900 border border-amber-300 font-bold"
                          : "bg-red-50 text-red-800 border border-red-200 font-bold"
                      }`}
                    >
                      {rev.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${
                            s <= rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-slate-900">{rev.title}</span>
                  </div>
                </div>

                <div className="text-right text-xs text-slate-500">
                  <span>{rev.date}</span>
                  {rev.productName && (
                    <span className="block text-slate-800 font-bold mt-0.5 text-xs">{rev.productName}</span>
                  )}
                </div>
              </div>

              {/* Review Comment Body */}
              <p className="text-sm text-slate-800 leading-relaxed">{rev.comment}</p>

              {/* Customer Photo Attachment Preview */}
              {rev.image && (
                <div className="pt-2">
                  <span className="text-xs text-slate-600 font-bold block mb-2">
                    Customer Photo Attachment:
                  </span>
                  <div className="relative w-48 h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs">
                    <Image
                      src={rev.image}
                      alt="Customer photo attachment"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Moderation Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                {rev.status !== "approved" && (
                  <button
                    onClick={() => handleUpdateStatus(rev.id, "approved")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve & Publish
                  </button>
                )}
                {rev.status !== "rejected" && (
                  <button
                    onClick={() => handleUpdateStatus(rev.id, "rejected")}
                    className="bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 hover:border-red-300 font-bold text-xs px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
