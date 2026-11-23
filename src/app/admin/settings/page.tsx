"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Truck,
  BarChart,
  Save,
  Globe,
  CheckCircle2,
  Send,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { ImageUpload } from "@/components/ui/ImageUpload";

export default function AdminSettingsPage() {
  const { showToast } = useToast();

  // Active settings tab
  const [activeTab, setActiveTab] = useState<"general" | "shipping" | "integrations" | "analytics">("general");
  const [isSaving, setIsSaving] = useState(false);

  // General & Company Details
  const [storeName, setStoreName] = useState("Motoplex Bangladesh");
  const [tagline, setTagline] = useState("Official Importer for Aprilia, Moto Guzzi & Vespa Parts");
  const [phone, setPhone] = useState("+880 1700-668675");
  const [email, setEmail] = useState("concierge@motoplexbd.com");
  const [address, setAddress] = useState("House 14, Road 112, Gulshan-2, Dhaka 1212");
  const [logoUrl, setLogoUrl] = useState("https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=200&auto=format&fit=crop");

  // Delivery Charges
  const [insideDhakaFee, setInsideDhakaFee] = useState<number>(80);
  const [outsideDhakaFee, setOutsideDhakaFee] = useState<number>(150);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(5000);

  // Courier Credentials
  const [steadfastApiKey, setSteadfastApiKey] = useState("");
  const [steadfastSecret, setSteadfastSecret] = useState("");
  const [pathaoClientId, setPathaoClientId] = useState("");
  const [pathaoClientSecret, setPathaoClientSecret] = useState("");

  // Telegram Alert Credentials
  const [telegramToken, setTelegramToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");

  // Cloudinary Credentials
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState("");
  const [cloudinaryApiKey, setCloudinaryApiKey] = useState("");

  // Analytics & Pixel
  const [fbPixelId, setFbPixelId] = useState("");
  const [gtmId, setGtmId] = useState("");

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    setTimeout(() => {
      setIsSaving(false);
      showToast("Settings Saved", "Motoplex store configurations updated successfully.", "success");
    }, 500);
  };

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
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight uppercase">
            STORE CONFIGURATION & INTEGRATIONS
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Manage showroom profile, delivery rates across 64 districts, courier APIs & Telegram bot
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-red-600/20 flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? "Saving..." : "Save All Changes"}</span>
        </button>
      </div>

      {/* 4 Clean Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto bg-white border border-slate-200 p-2 rounded-2xl text-sm font-bold scrollbar-none shadow-xs">
        {[
          { id: "general", label: "Showroom & Logo", icon: Building2 },
          { id: "shipping", label: "Delivery Charges", icon: Truck },
          { id: "integrations", label: "Courier & Telegram Bot", icon: Globe },
          { id: "analytics", label: "Pixel & Tracking", icon: BarChart },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "general" | "shipping" | "integrations" | "analytics")}
              className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-colors font-bold ${
                activeTab === tab.id
                  ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                  : "text-slate-700 hover:text-slate-950 hover:bg-slate-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        {/* 1. Showroom & Logo */}
        {activeTab === "general" && (
          <div className="space-y-6 max-w-4xl">
            <div className="border-b border-slate-200 pb-4">
              <h3 className="font-bold text-slate-950 text-lg">Showroom Identity & Brand Logo</h3>
              <p className="text-sm text-slate-600 mt-1">
                Official business details displayed on customer invoices, order confirmations, and notifications
              </p>
            </div>

            {/* Brand Logo Upload */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 shadow-2xs">
              <ImageUpload
                value={logoUrl}
                onChange={setLogoUrl}
                label="Showroom Brand Logo (Upload File)"
                helperText="PNG, JPG or WEBP under 2MB"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block text-xs uppercase tracking-wide">Showroom / Store Legal Name:</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block text-xs uppercase tracking-wide">Customer Support Phone (+880):</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 font-mono focus:outline-none focus:border-red-600 focus:bg-white text-sm"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-bold text-slate-800 block text-xs uppercase tracking-wide">Official Brand Tagline:</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block text-xs uppercase tracking-wide">Showroom Email Address:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block text-xs uppercase tracking-wide">Showroom Physical Address:</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. Delivery Rates Across 64 Districts */}
        {activeTab === "shipping" && (
          <div className="space-y-6 max-w-4xl text-sm">
            <div className="border-b border-slate-200 pb-4">
              <h3 className="font-bold text-slate-950 text-lg">Nationwide Delivery Charges</h3>
              <p className="text-slate-600 text-sm mt-1">
                Transparent courier rates calculated automatically during checkout for all 64 districts in Bangladesh
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2.5 shadow-2xs">
                <label className="font-bold text-slate-800 block text-xs uppercase tracking-wide">Inside Dhaka Fee (BDT):</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-bold text-slate-500">৳</span>
                  <input
                    type="number"
                    value={insideDhakaFee}
                    onChange={(e) => setInsideDhakaFee(Number(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 font-mono text-base focus:outline-none focus:border-red-600 font-bold"
                  />
                </div>
                <span className="text-xs text-slate-500 block font-medium">Standard Dhaka metro courier</span>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2.5 shadow-2xs">
                <label className="font-bold text-slate-800 block text-xs uppercase tracking-wide">Outside Dhaka (All 63 Districts):</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-bold text-slate-500">৳</span>
                  <input
                    type="number"
                    value={outsideDhakaFee}
                    onChange={(e) => setOutsideDhakaFee(Number(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 font-mono text-base focus:outline-none focus:border-red-600 font-bold"
                  />
                </div>
                <span className="text-xs text-slate-500 block font-medium">Chattogram, Sylhet, Rajshahi, etc.</span>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2.5 shadow-2xs">
                <label className="font-bold text-slate-800 block text-xs uppercase tracking-wide">Free Shipping Threshold:</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-bold text-slate-500">৳</span>
                  <input
                    type="number"
                    value={freeShippingThreshold}
                    onChange={(e) => setFreeShippingThreshold(Number(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 font-mono text-base focus:outline-none focus:border-red-600 font-bold"
                  />
                </div>
                <span className="text-xs text-slate-500 block font-medium">Orders over this qualify for Free Delivery</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. Courier APIs & Telegram Bot */}
        {activeTab === "integrations" && (
          <div className="space-y-6 max-w-4xl text-sm">
            <div className="border-b border-slate-200 pb-4">
              <h3 className="font-bold text-slate-950 text-lg">Courier Partners, COD & Telegram Bot</h3>
              <p className="text-slate-600 text-sm mt-1">
                100% Cash on Delivery (COD) order management, automated courier dispatch & instant Telegram admin alerts
              </p>
            </div>

            <div className="space-y-5">
              {/* Cash on Delivery Notice */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-950 text-base">Cash on Delivery (Exclusive Payment Mode)</span>
                  <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 100% Active Nationwide
                  </span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Every order is dispatched via Cash on Delivery with authorized customer open-box inspection. No payment gateway charges or credit card hassles.
                </p>
              </div>

              {/* Telegram Bot Order Alert Integration */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Send className="w-5 h-5 text-sky-600" />
                    <span className="font-bold text-slate-950 text-base">Telegram Admin Order Bot</span>
                  </div>
                  <span className="bg-sky-50 text-sky-800 text-xs font-bold px-3 py-1 rounded-full border border-sky-200">
                    Instant Notification
                  </span>
                </div>

                <p className="text-slate-600 text-xs">
                  Whenever a customer places an order on the storefront, this bot immediately alerts your Telegram admin group with order details, customer phone number, and delivery address.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-800 font-bold text-xs uppercase tracking-wide">Bot Token (@BotFather):</label>
                    <input
                      type="text"
                      placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRstuVWXyz"
                      value={telegramToken}
                      onChange={(e) => setTelegramToken(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono text-sm focus:outline-none focus:border-red-600 placeholder:text-slate-400"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-800 font-bold text-xs uppercase tracking-wide">Admin Group Chat ID:</label>
                    <input
                      type="text"
                      placeholder="e.g. -100xxxxxxxxxx"
                      value={telegramChatId}
                      onChange={(e) => setTelegramChatId(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono text-sm focus:outline-none focus:border-red-600 placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Courier Partners & Cloudinary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Steadfast */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-950 text-sm">Steadfast Courier API</strong>
                    <span className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">Active</span>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-700 text-xs font-bold">API Key:</label>
                    <input
                      type="text"
                      placeholder="Steadfast API Key"
                      value={steadfastApiKey}
                      onChange={(e) => setSteadfastApiKey(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 font-mono text-sm focus:outline-none focus:border-red-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-700 text-xs font-bold">Secret Key:</label>
                    <input
                      type="password"
                      placeholder="Steadfast Secret Key"
                      value={steadfastSecret}
                      onChange={(e) => setSteadfastSecret(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 font-mono text-sm focus:outline-none focus:border-red-600"
                    />
                  </div>
                </div>

                {/* Pathao */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-950 text-sm">Pathao Courier API</strong>
                    <span className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">Active</span>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-700 text-xs font-bold">Merchant Client ID:</label>
                    <input
                      type="text"
                      placeholder="Pathao Client ID"
                      value={pathaoClientId}
                      onChange={(e) => setPathaoClientId(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 font-mono text-sm focus:outline-none focus:border-red-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-700 text-xs font-bold">Client Secret:</label>
                    <input
                      type="password"
                      placeholder="Pathao Client Secret"
                      value={pathaoClientSecret}
                      onChange={(e) => setPathaoClientSecret(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 font-mono text-sm focus:outline-none focus:border-red-600"
                    />
                  </div>
                </div>

                {/* Cloudinary */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 sm:col-span-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-950 text-sm">Cloudinary Media CDN (Optional)</strong>
                    <span className="text-xs text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full font-bold">Free Forever Tier</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-700 text-[10px] font-bold">Cloud Name:</label>
                      <input
                        type="text"
                        placeholder="e.g. motoplexbd"
                        value={cloudinaryCloudName}
                        onChange={(e) => setCloudinaryCloudName(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-red-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-700 text-[10px] font-bold">API Key (Optional):</label>
                      <input
                        type="text"
                        placeholder="e.g. 192837492817293"
                        value={cloudinaryApiKey}
                        onChange={(e) => setCloudinaryApiKey(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-red-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Pixel & Tracking */}
        {activeTab === "analytics" && (
          <div className="space-y-6 max-w-3xl text-xs">
            <div className="border-b border-slate-200 pb-4">
              <h3 className="font-bold text-slate-950 text-base">Meta Pixel & Google Tag Manager</h3>
              <p className="text-slate-600 mt-0.5">
                Track visitor purchases, ROAS, and customer conversions automatically
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 shadow-2xs">
                <label className="font-bold text-slate-800 block">Meta / Facebook Pixel ID:</label>
                <input
                  type="text"
                  placeholder="e.g. 1284920491823901"
                  value={fbPixelId}
                  onChange={(e) => setFbPixelId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-red-600 placeholder:text-slate-400"
                />
                <span className="text-[10px] text-slate-500 block">Fires Purchase & ViewContent events</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 shadow-2xs">
                <label className="font-bold text-slate-800 block">Google Tag Manager (GTM) ID:</label>
                <input
                  type="text"
                  placeholder="e.g. GTM-XXXXXXX"
                  value={gtmId}
                  onChange={(e) => setGtmId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-red-600 placeholder:text-slate-400"
                />
                <span className="text-[10px] text-slate-500 block">For Google Analytics 4 tracking</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
