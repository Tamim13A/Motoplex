"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Filter, CheckCircle2 } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { formatDateSafe } from "@/lib/formatters";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "user" | "moderator" | "admin";
  isVerified: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | "admin" | "moderator" | "user">("all");

  useEffect(() => {
    const fetchLiveUsers = async () => {
      try {
        const res = await fetch("/api/admin/users");
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && Array.isArray(json.data?.users) && json.data.users.length > 0) {
          setUsers(json.data.users);
        }
      } catch {
        // Fallback to initial mock users
      }
    };
    fetchLiveUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: "user" | "moderator" | "admin") => {
    setUsers((prev) =>
      prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
    );

    showToast("Role Updated", `User role adjusted to ${newRole.toUpperCase()}.`, "success");

    try {
      await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
    } catch {
      // Optimistic update retained
    }
  };

  const filtered = users.filter((u) => {
    const matchRole = filterRole === "all" || u.role === filterRole;
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone && u.phone.includes(search));
    return matchRole && matchSearch;
  });

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
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
            USER & ROLE MANAGEMENT
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Manage rider accounts and assign access permissions: Customer User, Content Moderator, or Operations Admin.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs shadow-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          {(["all", "admin", "moderator", "user"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setFilterRole(r)}
              className={`px-3.5 py-1.5 rounded-xl font-bold capitalize transition-all ${
                filterRole === r
                  ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                  : "bg-slate-100 text-slate-700 hover:text-slate-950 border border-slate-200"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-600 focus:bg-white"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/90 text-slate-700 border-b border-slate-200 font-bold uppercase text-xs">
              <tr>
                <th className="py-4 px-6">Rider / Customer</th>
                <th className="py-4 px-6">Contact Details</th>
                <th className="py-4 px-6">Verification</th>
                <th className="py-4 px-6">Assigned Role</th>
                <th className="py-4 px-6 text-right">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-900 text-sm">
                        {(u.name || "U").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-slate-950 block text-sm">{u.name || "Customer"}</span>
                        <span className="text-xs text-slate-500 font-mono font-medium">ID: {String(u._id || "000000").slice(-6)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-800 font-medium">
                    <div className="text-sm font-semibold">{u.email}</div>
                    {u.phone && <div className="text-xs text-slate-500 font-mono mt-0.5">{u.phone}</div>}
                  </td>
                  <td className="py-4 px-6">
                    {u.isVerified ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> OTP Verified
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 font-medium">Unverified</span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value as "user" | "moderator" | "admin")}
                      className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-red-600 cursor-pointer shadow-2xs"
                    >
                      <option value="user">User (Customer)</option>
                      <option value="moderator">Moderator (Reviews/Support)</option>
                      <option value="admin">Admin (Full Operations)</option>
                    </select>
                  </td>
                  <td className="py-4 px-6 text-right text-slate-600 font-medium text-xs">
                    {formatDateSafe(u.createdAt, "en-BD")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
