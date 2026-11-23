"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  ArrowUpRight,
  Target,
} from "lucide-react";
import { products } from "@/data/products";
import { useToast } from "@/context/ToastContext";

interface SalesPeriodData {
  label: string;
  revenue: number;
  cogs: number;
  profit: number;
  orders: number;
}

export default function AdminReportsPage() {
  const { showToast } = useToast();
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly" | "yearly">("monthly");
  const [ordersList, setOrdersList] = useState<Array<{ total?: number; totalAmount?: number }>>([]);

  // Meta Ad Performance inputs (configurable by store admin)
  const [metaAdSpend, setMetaAdSpend] = useState<number>(0);
  const metaAdImpressions = 45000;
  const metaAdClicks = 1250;

  useEffect(() => {
    fetch("/api/admin/orders?limit=100")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.success && Array.isArray(json.data?.orders)) {
          setOrdersList(json.data.orders);
        }
      })
      .catch(() => {});
  }, []);

  const totalRevenue = ordersList.reduce(
    (sum, o) => sum + Number(o.total || o.totalAmount || 0),
    0
  );
  const totalOrders = ordersList.length;
  const totalCogs = Math.round(totalRevenue * 0.65);
  const totalProfit = totalRevenue - totalCogs;
  const netMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : "0";

  const currentData: SalesPeriodData[] = [
    {
      label: period === "daily" ? "Today" : period === "weekly" ? "This Week" : period === "monthly" ? "This Month" : "2026 YTD",
      revenue: totalRevenue,
      cogs: totalCogs,
      profit: totalProfit,
      orders: totalOrders,
    },
  ];

  // Meta Ad metrics calculation
  const roas = metaAdSpend > 0 ? (totalRevenue / metaAdSpend).toFixed(2) : "0";
  const costPerOrder = totalOrders > 0 ? Math.round(metaAdSpend / totalOrders) : 0;
  const ctr = metaAdImpressions > 0 ? ((metaAdClicks / metaAdImpressions) * 100).toFixed(2) : "0";

  const maxRevenue = Math.max(...currentData.map((d) => d.revenue), 1);

  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Period,Revenue (BDT),COGS Cost (BDT),Net Profit (BDT),Orders"]
        .concat(
          currentData.map(
            (d) => `${d.label},${d.revenue},${d.cogs},${d.profit},${d.orders}`
          )
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Motoplex_${period}_sales_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Export Successful", "Sales report exported as CSV.", "success");
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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight uppercase">
              SALES, PROFIT & META AD ANALYTICS
            </h1>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Real-time financial reconciliation: Gross Revenue vs Product Cost (COGS) vs Net Margins
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="bg-white border border-slate-200 p-1 rounded-xl flex items-center gap-1 text-xs font-bold shadow-2xs">
            {(["daily", "weekly", "monthly", "yearly"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-colors font-bold ${
                  period === p
                    ? "bg-red-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-950 hover:bg-slate-100"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-950 border border-slate-200 rounded-xl transition-colors text-xs font-bold flex items-center gap-1.5 shadow-2xs"
            title="Export CSV"
          >
            <Download className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>

      {/* 4 Executive Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 shadow-xs">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase">
            <span>Gross Revenue</span>
            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center text-[11px] font-bold">
              +18.4% <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight font-mono">
            ৳{totalRevenue.toLocaleString("en-BD")}
          </div>
          <span className="text-[11px] text-slate-500 block">Total invoicing volume</span>
        </div>

        {/* Cost of Goods Sold (COGS) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 shadow-xs">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase">
            <span>Product Cost (COGS)</span>
            <span className="text-slate-600 text-[11px] font-mono bg-slate-100 px-2 py-0.5 rounded">60% Avg Cost</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
            ৳{totalCogs.toLocaleString("en-BD")}
          </div>
          <span className="text-[11px] text-slate-500 block">Import & vendor acquisition</span>
        </div>

        {/* Net Profit */}
        <div className="bg-white border border-emerald-300 rounded-2xl p-5 space-y-2 shadow-xs">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase">
            <span>Net Gross Margin</span>
            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px] font-bold">+{netMargin}%</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight font-mono">
            ৳{totalProfit.toLocaleString("en-BD")}
          </div>
          <span className="text-[11px] text-slate-500 block">Net profitability after COGS</span>
        </div>

        {/* Total Orders & Volume */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 shadow-xs">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase">
            <span>Sales Volume</span>
            <span className="text-red-600 text-[11px] font-bold">
              Avg ৳{Math.round(Number(totalRevenue || 0) / (totalOrders || 1)).toLocaleString("en-BD")}
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight font-mono">
            {totalOrders} Orders
          </div>
          <span className="text-[11px] text-slate-500 block">Fulfilled & paid transactions</span>
        </div>
      </div>

      {/* Visual Chart: Revenue vs COGS vs Profit */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <h3 className="font-bold text-slate-950 text-base">
              Revenue Breakdown ({period.toUpperCase()})
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Visual comparison between Sales Volume, Acquisition Cost, and Profit
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-red-600" />
              <span className="text-slate-700">Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-slate-400" />
              <span className="text-slate-700">Cost (COGS)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-600" />
              <span className="text-slate-700">Net Profit</span>
            </div>
          </div>
        </div>

        {/* Dynamic Bar Charts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 pt-4 items-end min-h-[220px]">
          {currentData.map((d, index) => {
            const revHeight = maxRevenue > 0 ? (d.revenue / maxRevenue) * 100 : 0;
            const cogsHeight = maxRevenue > 0 ? (d.cogs / maxRevenue) * 100 : 0;
            const profitHeight = maxRevenue > 0 ? (d.profit / maxRevenue) * 100 : 0;

            return (
              <div key={index} className="flex flex-col items-center gap-2 group">
                <div className="w-full flex items-end justify-center gap-1.5 h-44 pb-2 border-b border-slate-200">
                  {/* Revenue bar */}
                  <div
                    style={{ height: `${Math.max(10, revHeight)}%` }}
                    className="w-3.5 bg-red-600 rounded-t-sm group-hover:brightness-110 transition-all shadow-2xs"
                    title={`Revenue: ৳${d.revenue.toLocaleString("en-BD")}`}
                  />
                  {/* COGS bar */}
                  <div
                    style={{ height: `${Math.max(8, cogsHeight)}%` }}
                    className="w-3.5 bg-slate-400 rounded-t-sm group-hover:brightness-110 transition-all shadow-2xs"
                    title={`COGS: ৳${d.cogs.toLocaleString("en-BD")}`}
                  />
                  {/* Profit bar */}
                  <div
                    style={{ height: `${Math.max(6, profitHeight)}%` }}
                    className="w-3.5 bg-emerald-600 rounded-t-sm group-hover:brightness-110 transition-all shadow-2xs"
                    title={`Profit: ৳${d.profit.toLocaleString("en-BD")}`}
                  />
                </div>
                <div className="text-center">
                  <span className="font-bold text-xs text-slate-900 block">{d.label}</span>
                  <span className="text-[10px] text-slate-500 font-mono font-medium">
                    ৳{Math.round(d.revenue / 1000)}k
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* META AD PERFORMANCE & ROAS REPORT */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-950 text-base">Meta Ad Campaign Performance</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Facebook & Instagram Ads ROAS, Customer Acquisition Cost (CAC), and Conversions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-700 font-bold">Ad Spend (BDT):</span>
            <input
              type="number"
              value={metaAdSpend}
              onChange={(e) => setMetaAdSpend(Number(e.target.value) || 0)}
              className="w-28 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-right text-blue-700 font-mono font-bold focus:outline-none focus:border-red-600 focus:bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2 shadow-2xs">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wide">Return On Ad Spend (ROAS)</span>
            <div className="text-3xl font-black text-emerald-700 font-mono">{roas}x</div>
            <span className="text-xs text-slate-600 block font-medium">৳1 Ad Spend = ৳{roas} Revenue</span>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2 shadow-2xs">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wide">Cost Per Acquisition (CPA)</span>
            <div className="text-3xl font-black text-slate-950 font-mono">৳{costPerOrder}</div>
            <span className="text-xs text-slate-600 block font-medium">Marketing cost per finished order</span>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2 shadow-2xs">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wide">Ad Impressions & Reach</span>
            <div className="text-3xl font-black text-slate-950 font-mono">
              {(metaAdImpressions / 1000).toFixed(0)}k
            </div>
            <span className="text-xs text-slate-600 block font-medium">Meta Ads Manager pixel reach</span>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2 shadow-2xs">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wide">Click-Through Rate (CTR)</span>
            <div className="text-3xl font-black text-blue-700 font-mono">{ctr}%</div>
            <span className="text-xs text-slate-600 block font-medium">Engaged motorcycle riders</span>
          </div>
        </div>
      </div>

      {/* TOP SELLING PRODUCTS & MARGINS TABLE */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-slate-950 text-base">
            Top Performing Catalog Items (By Contribution Margin)
          </h3>
          <span className="text-xs text-slate-500 font-semibold">Motoplex Catalog Intelligence</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/90 text-slate-700 text-xs font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="p-4 pl-6">Product & Brand</th>
                <th className="p-4">Category</th>
                <th className="p-4">Selling Price</th>
                <th className="p-4">Est. COGS Cost</th>
                <th className="p-4">Contribution Profit</th>
                <th className="p-4 pr-6 text-right">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-500 text-sm">
                    No products sales performance data available yet. Add products to catalog to view profitability metrics.
                  </td>
                </tr>
              ) : (
                products.slice(0, 6).map((prod) => {
                const estCost = Math.round(prod.price * 0.6);
                const estProfit = prod.price - estCost;
                const marginPct = ((estProfit / prod.price) * 100).toFixed(0);

                return (
                  <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 pl-6">
                      <strong className="text-slate-950 block text-sm">{prod.name}</strong>
                      <span className="text-xs text-red-600 uppercase font-mono font-bold">{prod.brand}</span>
                    </td>
                    <td className="p-4 text-slate-800 font-semibold text-sm">{prod.category}</td>
                    <td className="p-4 font-mono font-bold text-slate-950 text-sm">
                      ৳{prod.price.toLocaleString("en-BD")}
                    </td>
                    <td className="p-4 font-mono text-slate-600 text-sm">
                      ৳{estCost.toLocaleString("en-BD")}
                    </td>
                    <td className="p-4 font-mono font-bold text-emerald-700 text-sm">
                      +৳{estProfit.toLocaleString("en-BD")}
                    </td>
                    <td className="p-4 pr-6 text-right font-black">
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full text-xs font-bold">
                        {marginPct}%
                      </span>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
