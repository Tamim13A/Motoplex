"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { formatDateSafe } from "@/lib/formatters";

interface AdminCoupon {
  id?: string;
  code: string;
  type: string;
  value: string;
  minOrder: number;
  usageCount: number;
  status: "Active" | "Expired";
  expiry: string;
}

interface CouponApiItem {
  _id?: string;
  id?: string;
  code: string;
  type?: string;
  value?: number;
  minOrder?: number;
  currentUses?: number;
  isActive?: boolean;
  expiresAt: string;
}

export default function AdminCouponsPage() {
  const { showToast } = useToast();

  const [coupons, setCoupons] = useState<AdminCoupon[]>([
    {
      code: "MOTO10",
      type: "Percentage (10%)",
      value: "10% Off",
      minOrder: 2000,
      usageCount: 0,
      status: "Active",
      expiry: "31 Dec 2026",
    },
    {
      code: "FREESHIP",
      type: "Free Courier Delivery",
      value: "100% Off Shipping",
      minOrder: 1000,
      usageCount: 0,
      status: "Active",
      expiry: "Ongoing 2026",
    },
    {
      code: "VIPRIDER",
      type: "Flat BDT Discount",
      value: "৳1,500 Off",
      minOrder: 15000,
      usageCount: 0,
      status: "Active",
      expiry: "30 Nov 2026",
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newMin, setNewMin] = useState("");

  // Fetch live coupons from DB
  React.useEffect(() => {
    const fetchAdminCoupons = async () => {
      try {
        const res = await fetch("/api/admin/coupons");
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const mapped: AdminCoupon[] = json.data.map((c: CouponApiItem) => ({
            id: c._id?.toString() || c.id,
            code: c.code,
            type:
              c.type === "percentage"
                ? `Percentage (${c.value}%)`
                : c.type === "free_shipping"
                ? "Free Courier Delivery"
                : "Flat Discount",
            value:
              c.type === "percentage"
                ? `${c.value}% Off`
                : c.type === "free_shipping"
                ? "Free Delivery"
                : `৳${c.value} Off`,
            minOrder: c.minOrder || 0,
            usageCount: c.currentUses || 0,
            status: c.isActive ? "Active" : "Expired",
            expiry: formatDateSafe(c.expiresAt, "en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
          }));
          setCoupons(mapped);
        }
      } catch {
        // Fallback to initial mock list
      }
    };
    fetchAdminCoupons();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;

    const code = newCode.trim().toUpperCase();
    const minOrder = Number(newMin) || 1000;
    const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

    const newC: AdminCoupon = {
      code,
      type: "Custom Campaign",
      value: newValue || "10% Off",
      minOrder,
      usageCount: 0,
      status: "Active",
      expiry: "60 Days Validity",
    };

    setCoupons([newC, ...coupons]);
    setIsModalOpen(false);
    showToast("Coupon Created", `Voucher ${code} is now live across Bangladesh.`, "success");
    setNewCode("");
    setNewValue("");
    setNewMin("");

    try {
      await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          type: "percentage",
          value: 10,
          minOrder,
          expiresAt,
          isActive: true,
        }),
      });
    } catch {
      // Local state is already updated
    }
  };

  const handleDelete = async (code: string) => {
    const target = coupons.find((c) => c.code === code);
    setCoupons((prev) => prev.filter((c) => c.code !== code));
    showToast("Coupon Deleted", `Code ${code} deactivated.`, "info");

    if (target?.id) {
      try {
        await fetch(`/api/admin/coupons/${target.id}`, { method: "DELETE" });
      } catch {
        // Local state is already updated
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard Overview
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
            PROMOTIONAL COUPONS & VOUCHERS
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Create and track promo discount vouchers for marketing campaigns
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-3 rounded-xl transition-all shadow-md shadow-red-600/20 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Promo Voucher</span>
        </button>
      </div>

      {/* Coupons Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/90 text-slate-700 text-xs font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="p-4 pl-6">Voucher Code</th>
                <th className="p-4">Discount Value</th>
                <th className="p-4">Min Order (BDT)</th>
                <th className="p-4">Redemptions</th>
                <th className="p-4">Expiry Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coupons.map((c) => (
                <tr key={c.code} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-4 pl-6">
                    <span className="font-mono font-black text-slate-950 text-sm bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                      {c.code}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-emerald-700 text-sm">{c.value}</td>
                  <td className="p-4 font-mono font-bold text-slate-900 text-sm">৳{c.minOrder.toLocaleString("en-BD")}</td>
                  <td className="p-4 font-semibold text-slate-700 text-xs">{c.usageCount} orders</td>
                  <td className="p-4 text-slate-500 font-medium text-xs">{c.expiry}</td>
                  <td className="p-4">
                    <span className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                      {c.status}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <button
                      onClick={() => handleDelete(c.code)}
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      title="Deactivate coupon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 space-y-4 shadow-2xl text-sm">
            <h3 className="font-bold text-base text-slate-950 pb-2 border-b border-slate-200">
              Create New Promotion Code
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="font-bold text-slate-800 block mb-1.5 text-xs uppercase tracking-wide">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MOTO20"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono text-sm uppercase focus:outline-none focus:border-red-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1.5 text-xs uppercase tracking-wide">Discount Value *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 15% Off or ৳500 Flat"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-red-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1.5 text-xs uppercase tracking-wide">Minimum Order Amount (BDT) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 3000"
                  value={newMin}
                  onChange={(e) => setNewMin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-red-600 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-100 text-slate-700 border border-slate-300 font-bold py-2.5 rounded-xl hover:bg-slate-200 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl hover:bg-red-700 shadow-md shadow-red-600/20 transition-all text-sm"
                >
                  Create Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
