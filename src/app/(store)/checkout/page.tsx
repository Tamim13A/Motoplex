"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  Truck,
  CreditCard,
  ArrowRight,
  PackageCheck,
  Printer,
  Copy,
  Check,
  Building2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { bangladeshDivisions } from "@/data/bangladesh";
import { InvoiceModal } from "@/components/ui/InvoiceModal";
import { Order } from "@/types";

const BANK_DETAILS = {
  DBBL: {
    bankName: "Dutch-Bangla Bank (DBBL)",
    accountName: "MOTOPLEX",
    accountNumber: "1641510237133",
    branch: "Mirpur Branch, Dhaka",
    badge: "Rocket / Dutch Bangla",
  },
  City: {
    bankName: "The City Bank Limited",
    accountName: "MOTOPLEX",
    accountNumber: "1455042635001",
    branch: "Mirpur Branch, Dhaka",
    badge: "City Bank / City Touch",
  },
  BRAC: {
    bankName: "BRAC Bank Limited",
    accountName: "MOTOPLEX",
    accountNumber: "2071151390001",
    branch: "Mirpur Branch, Dhaka",
    badge: "BRAC Bank / Astha App",
  },
};

export default function CheckoutPage() {
  const { items, subtotal, discount, shippingFee, total, clearCart, setShippingDestination } = useCart();
  const { showToast } = useToast();

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [division, setDivision] = useState("Dhaka");
  const [district, setDistrict] = useState("Dhaka");
  const [area, setArea] = useState("Mirpur");
  const [streetAddress, setStreetAddress] = useState("");

  // Payment states - advance courier fee
  const [paymentMethod, setPaymentMethod] = useState<"bkash" | "bank">("bkash");
  const [senderBkashNumber, setSenderBkashNumber] = useState("");
  const [bkashTrxId, setBkashTrxId] = useState("");
  const [copiedBkash, setCopiedBkash] = useState(false);

  const [selectedBank, setSelectedBank] = useState<"DBBL" | "City" | "BRAC">("DBBL");
  const [depositorName, setDepositorName] = useState("");
  const [bankTrxRef, setBankTrxRef] = useState("");
  const [copiedBankAcc, setCopiedBankAcc] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [generatedOrderNumber, setGeneratedOrderNumber] = useState("");
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Sync shipping destination when district changes (Dhaka = ৳80, Outside Dhaka = ৳130)
  useEffect(() => {
    if (district.trim().toLowerCase() === "dhaka") {
      setShippingDestination("dhaka");
    } else {
      setShippingDestination("outside_dhaka");
    }
  }, [district, setShippingDestination]);

  // Pre-fill only if user is actively logged in
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.success && json.data?.user) {
          const u = json.data.user;
          if (u.name) setFullName(u.name);
          if (u.email) setEmail(u.email);
          if (u.phone) setPhone(u.phone);
        }
      })
      .catch(() => {});
  }, []);

  // Districts for current division
  const currentDivisionData = bangladeshDivisions.find((d) => d.division === division);
  const availableDistricts = currentDivisionData ? Object.keys(currentDivisionData.districts) : [];
  const availableAreas =
    currentDivisionData && currentDivisionData.districts[district]
      ? currentDivisionData.districts[district]
      : [];

  const handleCopyBkash = () => {
    navigator.clipboard.writeText("01879388902");
    setCopiedBkash(true);
    showToast("নম্বর কপি হয়েছে", "বিকাশ এজেন্ট নম্বর 01879388902 ক্লিপবোর্ডে কপি করা হয়েছে।", "success");
    setTimeout(() => setCopiedBkash(false), 3000);
  };

  const handleCopyBank = (accNumber: string, bankLabel: string) => {
    navigator.clipboard.writeText(accNumber);
    setCopiedBankAcc(accNumber);
    showToast("হিসাব নম্বর কপি হয়েছে", `${bankLabel} হিসাব নম্বর ${accNumber} কপি করা হয়েছে।`, "success");
    setTimeout(() => setCopiedBankAcc(null), 3000);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      showToast("কার্ট খালি", "অনুগ্রহ করে চেকআউটের আগে কার্টে পণ্য যোগ করুন।", "error");
      return;
    }

    const errors: Record<string, string> = {};

    if (!fullName.trim()) {
      errors.fullName = "আপনার পূর্ণ নাম লিখুন";
    }

    const cleanDigits = phone.replace(/\D/g, "");
    if (!phone.trim()) {
      errors.phone = "সচল মোবাইল নম্বর লিখুন";
    } else if (cleanDigits.length < 6) {
      errors.phone = "কমপক্ষে ৬ ডিজিটের সঠিক ফোন নম্বর দিন";
    }

    const effectiveAddress =
      streetAddress.trim() ||
      [area, district, division].filter(Boolean).join(", ") ||
      "Dhaka, Bangladesh";

    // Payment validation
    if (paymentMethod === "bkash") {
      if (!senderBkashNumber.trim()) {
        errors.senderBkashNumber = "যে বিকাশ নম্বর থেকে টাকা পাঠিয়েছেন তা লিখুন";
      }
      if (!bkashTrxId.trim()) {
        errors.bkashTrxId = "বিকাশ TrxID দিন";
      }
    } else {
      if (!bankTrxRef.trim()) {
        errors.bankTrxRef = "ব্যাংক ট্রানজেকশন রেফারেন্স বা ডিপোজিট স্লিপ নম্বর লিখুন";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstMsg = Object.values(errors)[0];
      showToast("তথ্য অসম্পূর্ণ", firstMsg, "error");
      return;
    }
    setFieldErrors({});

    setIsSubmitting(true);

    try {
      const rawDigits = phone.replace(/\D/g, "");
      const normalizedPhone =
        rawDigits.length === 10 && rawDigits.startsWith("1")
          ? `0${rawDigits}`
          : rawDigits.startsWith("880") && rawDigits.length === 13
          ? `0${rawDigits.slice(3)}`
          : phone.trim();

      const activeBank = BANK_DETAILS[selectedBank];

      const paymentDetails =
        paymentMethod === "bkash"
          ? {
              advancePaymentMethod: "bKash Agent Cash Out",
              advanceAmount: shippingFee,
              senderNumber: senderBkashNumber.trim(),
              trxId: bkashTrxId.trim().toUpperCase(),
            }
          : {
              advancePaymentMethod: `Bank Transfer (${activeBank.bankName})`,
              advanceAmount: shippingFee,
              bankName: activeBank.bankName,
              accountNumber: activeBank.accountNumber,
              senderNumber: depositorName.trim() || fullName.trim(),
              trxId: bankTrxRef.trim().toUpperCase(),
              reference: bankTrxRef.trim().toUpperCase(),
            };

      const payload = {
        items: items.map((i) => ({
          productId: i.product.id || (i.product as any)._id || i.product.slug || i.product.sku || "motoplex-part",
          variantId: i.selectedVariant?.sku || i.selectedVariant?.id || undefined,
          quantity: Math.max(1, i.quantity || 1),
        })),
        shippingAddress: {
          fullName: fullName.trim(),
          phone: normalizedPhone,
          division: division || "Dhaka",
          district: district || "Dhaka",
          area: area || "General Area",
          address: effectiveAddress,
        },
        deliveryMethod:
          district.trim().toLowerCase() === "dhaka"
            ? "Pathao Express (Inside Dhaka - ৳80)"
            : "Pathao Express (All Bangladesh - ৳130)",
        paymentMethod: paymentMethod === "bkash" ? "bKash Agent Cash Out" : "Bank Transfer",
        paymentDetails,
        customerInfo: {
          fullName: fullName.trim(),
          email: email.trim() || "customer@motoplexbd.com",
          phone: normalizedPhone,
        },
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        let errText = resData.message;
        if (resData.issues && Array.isArray(resData.issues) && resData.issues.length > 0) {
          errText = resData.issues.map((issue: any) => issue.message).filter(Boolean).join(" • ");
        } else if (resData.errors && typeof resData.errors === "object") {
          const allErrors = Object.values(resData.errors).flat();
          if (allErrors.length > 0 && typeof allErrors[0] === "string") {
            errText = allErrors.join(" • ");
          }
        }
        throw new Error(errText || "অর্ডার সম্পন্ন হতে পারেনি। অনুগ্রহ করে তথ্যাবলী যাচাই করে পুনরায় চেষ্টা করুন।");
      }

      const confirmedData: Order = resData.data?.order || {
        id: `ord-${Date.now()}`,
        orderNumber: `MPX-${Date.now().toString(36).toUpperCase()}`,
        date: new Date().toLocaleDateString("en-GB"),
        status: "Pending",
        items: items.map((i) => ({
          productId: i.product.id,
          productName: i.product.name,
          productImage: i.product.images?.[0] || "",
          variantInfo: [i.selectedSize, i.selectedColor, i.selectedMaterial].filter(Boolean).join(" / ") || "Standard",
          price: i.selectedVariant?.price || i.product.price,
          quantity: i.quantity,
          total: (i.selectedVariant?.price || i.product.price) * i.quantity,
        })),
        subtotal,
        shippingFee,
        discount,
        total,
        advancePaid: shippingFee,
        dueAmount: subtotal,
        paymentDetails,
        shippingAddress: {
          fullName,
          phone: normalizedPhone,
          division,
          district,
          area,
          address: effectiveAddress,
        },
        deliveryMethod:
          district.trim().toLowerCase() === "dhaka"
            ? "Pathao Express (Inside Dhaka - ৳80)"
            : "Pathao Express (All Bangladesh - ৳130)",
        paymentMethod: paymentMethod === "bkash" ? "bKash Agent Cash Out" : "Bank Transfer",
        courierName: "Pathao",
        trackingNumber: "PTH-PENDING",
      };

      const finalOrderNo = confirmedData.orderNumber;
      setConfirmedOrder(confirmedData);
      setGeneratedOrderNumber(finalOrderNo);
      setIsSubmitting(false);
      setOrderConfirmed(true);
      clearCart();
      showToast(
        "অর্ডার সফলভাবে গ্রহণ করা হয়েছে!",
        `আপনার অর্ডার নম্বর #${finalOrderNo} নথিভুক্ত হয়েছে। পাঠাও কুরিয়ারে দ্রুত পাঠানো হবে।`,
        "success"
      );
    } catch (err: unknown) {
      setIsSubmitting(false);
      const errMsg = err instanceof Error ? err.message : "অর্ডার সম্পন্ন করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।";
      showToast("অর্ডার গ্রহণ করা যায়নি", errMsg, "error");
    }
  };

  if (orderConfirmed) {
    const isDhaka = (confirmedOrder?.shippingAddress?.district || "").trim().toLowerCase() === "dhaka";
    return (
      <div className="bg-zinc-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-xl w-full bg-white rounded-3xl border border-zinc-200 p-8 sm:p-10 shadow-xl space-y-6 text-center animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
            <PackageCheck className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-300">
              অর্ডার গ্রহণ করা হয়েছে • পেমেন্ট যাচাই প্রক্রিয়াধীন
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-950">
              ধন্যবাদ, {fullName.toUpperCase()}!
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed max-w-md mx-auto">
              আপনার দেওয়া অগ্রিম কুরিয়ার চার্জের পেমেন্ট তথ্য (TrxID) আমাদের টিম যাচাই করার পর পার্সেল প্যাক করে দ্রুত পাঠাও কুরিয়ারে হস্তান্তর করবে।
            </p>
          </div>

          {/* Order Details Card */}
          <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 text-left text-xs space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-200">
              <span className="text-zinc-500 font-semibold">অর্ডার নম্বর:</span>
              <span className="font-mono font-black text-sm text-red-600">
                {generatedOrderNumber}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 font-semibold">ডেলিভারি ঠিকানা:</span>
              <span className="font-bold text-zinc-900 text-right max-w-[60%] truncate">
                {streetAddress}, {area}, {district}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 font-semibold">কুরিয়ার পার্টনার:</span>
              <span className="font-bold text-zinc-900">
                Pathao Express ({isDhaka ? "ঢাকা সিটি - ২৪-৪৮ ঘণ্টা" : "সারা বাংলাদেশ - ২-৩ দিন"})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 font-semibold">অগ্রিম কুরিয়ার ফি:</span>
              <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                ৳{(confirmedOrder?.advancePaid ?? shippingFee).toLocaleString("en-BD")} (যাচাই প্রক্রিয়াধীন)
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-zinc-200 text-sm">
              <span className="font-bold text-zinc-900">ক্যাশ অন ডেলিভারিতে প্রদেয় (বাকি টাকা):</span>
              <span className="font-black text-red-600 text-base">
                ৳{(confirmedOrder?.dueAmount ?? subtotal).toLocaleString("en-BD")}
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 text-left flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              পাঠাও রাইডার আপনার ঠিকানায় পার্সেল নিয়ে পৌঁছালে বক্স ও পণ্যের ইনভয়েস মিলিয়ে বাকি <strong>৳{(confirmedOrder?.dueAmount ?? subtotal).toLocaleString("en-BD")} টাকা</strong> বুঝিয়ে দিন।
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/track?order=${generatedOrderNumber}`}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              <Truck className="w-4 h-4" /> লাইভ ট্র্যাকিং
            </Link>
            {confirmedOrder && (
              <button
                type="button"
                onClick={() => setIsInvoiceOpen(true)}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-3.5 rounded-xl transition-all shadow-md shadow-red-600/20 flex items-center justify-center gap-2 active:scale-95"
              >
                <Printer className="w-4 h-4" /> ইনভয়েস দেখুন ও প্রিন্ট করুন
              </button>
            )}
            <Link
              href="/shop"
              className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs px-6 py-3.5 rounded-xl transition-colors flex items-center justify-center"
            >
              আরও পার্টস দেখুন
            </Link>
          </div>
        </div>

        {confirmedOrder && (
          <InvoiceModal
            order={confirmedOrder}
            isOpen={isInvoiceOpen}
            onClose={() => setIsInvoiceOpen(false)}
          />
        )}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-zinc-50 min-h-[70vh] flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-zinc-200 p-8 text-center space-y-5 shadow-sm animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 mx-auto flex items-center justify-center">
            <CreditCard className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-zinc-950">আপনার কার্ট খালি</h2>
            <p className="text-xs text-zinc-500">
              চেকআউট করার আগে শপ থেকে প্রয়োজনীয় মোটরসাইকেল পার্টস বা রাইডিং গিয়ার সিলেক্ট করুন।
            </p>
          </div>
          <Link
            href="/shop"
            className="inline-block w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-3.5 rounded-xl shadow-md transition-all active:scale-98"
          >
            মটোপ্লেক্স শপে যান
          </Link>
        </div>
      </div>
    );
  }

  const isDhakaCity = district.trim().toLowerCase() === "dhaka";

  return (
    <div className="bg-zinc-50/70 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="pb-6 mb-8 border-b border-zinc-200">
          <span className="text-xs font-bold text-red-600 uppercase tracking-widest">
            Fast & Secure Courier Checkout
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 mt-1 tracking-tight">
            অর্ডার ও ডেলিভারি কনফার্মেশন
          </h1>
        </div>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Form: Customer, Address, Logistics, Advance Payment */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Customer Info */}
            <div className="p-6 bg-white rounded-2xl border border-zinc-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-zinc-100">
                <span className="w-6 h-6 rounded-full bg-zinc-950 text-white text-xs font-black flex items-center justify-center">
                  1
                </span>
                <h3 className="font-bold text-sm text-zinc-950 uppercase tracking-wider">
                  গ্রাহকের তথ্য (Customer Information)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-zinc-900 block mb-1">আপনার পূর্ণ নাম *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. তানভীর আহমেদ"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (fieldErrors.fullName) setFieldErrors((p) => ({ ...p, fullName: "" }));
                    }}
                    className={`w-full rounded-xl px-3.5 py-2.5 text-zinc-900 focus:outline-none focus:ring-1 ${
                      fieldErrors.fullName
                        ? "bg-red-50/30 border border-red-500 focus:ring-red-600"
                        : "bg-zinc-50 border border-zinc-200 focus:ring-red-600"
                    }`}
                  />
                  {fieldErrors.fullName && (
                    <p className="text-[11px] text-red-600 font-semibold mt-1">{fieldErrors.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="font-bold text-zinc-900 block mb-1">ইমেইল ঠিকানা (ইনভয়েসের জন্য)</label>
                  <input
                    type="email"
                    placeholder="e.g. rider@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-zinc-900 block mb-1">
                    মোবাইল নম্বর (সচল ফোন নম্বর) *
                  </label>
                  <div
                    className={`flex rounded-xl overflow-hidden border ${
                      fieldErrors.phone
                        ? "border-red-500 bg-red-50/20"
                        : "border border-zinc-200 bg-zinc-50"
                    }`}
                  >
                    <span className="px-3 py-2.5 bg-zinc-100 border-r border-zinc-200 font-bold text-zinc-600 text-xs flex items-center">
                      +880
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="017XXXXXXXX"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (fieldErrors.phone) setFieldErrors((p) => ({ ...p, phone: "" }));
                      }}
                      className="flex-1 bg-transparent px-3 py-2.5 text-zinc-900 focus:outline-none text-xs font-semibold"
                    />
                  </div>
                  {fieldErrors.phone ? (
                    <p className="text-[11px] text-red-600 font-semibold mt-1">{fieldErrors.phone}</p>
                  ) : (
                    <span className="text-[11px] text-zinc-500 mt-1 block">
                      পাঠাও রাইডার ডেলিভারির পূর্বে এই নম্বরে কল করবে।
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Step 2: Delivery Address (Bangladesh Administrative Structure) */}
            <div className="p-6 bg-white rounded-2xl border border-zinc-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-zinc-100">
                <span className="w-6 h-6 rounded-full bg-zinc-950 text-white text-xs font-black flex items-center justify-center">
                  2
                </span>
                <h3 className="font-bold text-sm text-zinc-950 uppercase tracking-wider">
                  ডেলিভারি ঠিকানা (Shipping Address)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                {/* Division */}
                <div>
                  <label className="font-bold text-zinc-900 block mb-1">বিভাগ (Division) *</label>
                  <select
                    value={division}
                    onChange={(e) => {
                      const newDiv = e.target.value;
                      setDivision(newDiv);
                      const divData = bangladeshDivisions.find((d) => d.division === newDiv);
                      const firstDist = divData ? Object.keys(divData.districts)[0] : "";
                      setDistrict(firstDist);
                      setArea(divData?.districts[firstDist]?.[0] || "");
                    }}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-600 font-semibold cursor-pointer"
                  >
                    {bangladeshDivisions.map((d) => (
                      <option key={d.division} value={d.division}>
                        {d.division}
                      </option>
                    ))}
                  </select>
                </div>

                {/* District */}
                <div>
                  <label className="font-bold text-zinc-900 block mb-1">জেলা (District) *</label>
                  <select
                    value={district}
                    onChange={(e) => {
                      const newDist = e.target.value;
                      setDistrict(newDist);
                      setArea(currentDivisionData?.districts[newDist]?.[0] || "");
                    }}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-600 font-semibold cursor-pointer"
                  >
                    {availableDistricts.map((dst) => (
                      <option key={dst} value={dst}>
                        {dst}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Area / Thana */}
                <div>
                  <label className="font-bold text-zinc-900 block mb-1">থানা / এরিয়া *</label>
                  {availableAreas.length > 0 ? (
                    <select
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-600 font-semibold cursor-pointer"
                    >
                      {availableAreas.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="এরিয়া / থানার নাম"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-zinc-900 text-xs font-semibold"
                    />
                  )}
                </div>

                {/* Full Street Address */}
                <div className="sm:col-span-3">
                  <label className="font-bold text-zinc-900 block mb-1">
                    সম্পূর্ণ ঠিকানা (বাসা/রোড নম্বর ও ল্যান্ডমার্ক) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: বাড়ি #১২, রোড #০৫, সেক্টর #৩, অথবা দোকানের নাম ও বাজার"
                    value={streetAddress}
                    onChange={(e) => {
                      setStreetAddress(e.target.value);
                      if (fieldErrors.streetAddress) setFieldErrors((p) => ({ ...p, streetAddress: "" }));
                    }}
                    className={`w-full rounded-xl px-3.5 py-2.5 text-zinc-900 focus:outline-none focus:ring-1 ${
                      fieldErrors.streetAddress
                        ? "bg-red-50/30 border border-red-500 focus:ring-red-600"
                        : "bg-zinc-50 border border-zinc-200 focus:ring-red-600"
                    }`}
                  />
                  {fieldErrors.streetAddress && (
                    <p className="text-[11px] text-red-600 font-semibold mt-1">{fieldErrors.streetAddress}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Step 3: Courier Delivery Method (Pathao Express Only) */}
            <div className="p-6 bg-white rounded-2xl border border-zinc-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-zinc-100">
                <span className="w-6 h-6 rounded-full bg-zinc-950 text-white text-xs font-black flex items-center justify-center">
                  3
                </span>
                <h3 className="font-bold text-sm text-zinc-950 uppercase tracking-wider">
                  কুরিয়ার সার্ভিস (Pathao Express Courier)
                </h3>
              </div>

              {/* Pathao Courier Card */}
              <div className="p-4 rounded-xl border border-red-600 bg-red-50/40 ring-1 ring-red-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-red-600 text-white font-black text-xs flex flex-col items-center justify-center shrink-0 shadow-xs">
                    <Truck className="w-5 h-5" />
                    <span className="text-[9px] uppercase tracking-tighter">Pathao</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-zinc-950 text-sm">Pathao Express Courier</strong>
                      <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                        অফিসিয়াল পার্টনার
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-600 mt-0.5">
                      {isDhakaCity
                        ? "ঢাকার ভেতরে ২৪ - ৪৮ ঘণ্টার মধ্যে দ্রুত হোম ডেলিভারি।"
                        : "সারা বাংলাদেশে (৬৪ জেলায়) ২ - ৩ কার্যদিবসের মধ্যে কুরিয়ার ডেলিভারি।"}
                    </p>
                  </div>
                </div>

                <div className="text-right sm:border-l sm:border-red-200 sm:pl-4 shrink-0">
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">
                    {isDhakaCity ? "ঢাকা সিটির চার্জ" : "সারা বাংলাদেশের চার্জ"}
                  </span>
                  <span className="text-lg font-black text-red-600">
                    ৳{shippingFee}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-zinc-500 bg-zinc-50 px-3 py-2 rounded-lg border border-zinc-200">
                <HelpCircle className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                <span>
                  পাঠাও কুরিয়ারের নিয়ম অনুযায়ী ঢাকার ভেতরে ডেলিভারি চার্জ <strong>৳৮০</strong> এবং ঢাকার বাইরে সারা বাংলাদেশে <strong>৳১৩০</strong>।
                </span>
              </div>
            </div>

            {/* Step 4: Advance Courier Fee Payment (Bkash Cashout or 3 Banks) */}
            <div className="p-6 bg-white rounded-2xl border-2 border-red-500/40 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-red-600 text-white text-xs font-black flex items-center justify-center">
                    4
                  </span>
                  <h3 className="font-bold text-sm text-zinc-950 uppercase tracking-wider">
                    অগ্রিম কুরিয়ার চার্জ পরিশোধ (Advance Payment)
                  </h3>
                </div>
                <span className="text-xs font-extrabold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                  ৳{shippingFee} টাকা অগ্রিম প্রদেয়
                </span>
              </div>

              {/* Informational Alert */}
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200/90 text-xs text-amber-950 space-y-1">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>জরুরি নিয়মাবলী:</span>
                </div>
                <p className="text-[11.5px] leading-relaxed text-amber-900/90 pl-6">
                  অর্ডার কনফার্ম করার জন্য শুধুমাত্র পাঠাও ডেলিভারি চার্জ (<strong>৳{shippingFee} টাকা</strong>) অগ্রিম পরিশোধ করতে হবে। প্রোডাক্টের বাকি <strong>৳{subtotal.toLocaleString("en-BD")} টাকা</strong> পার্সেল হাতে পেয়ে ক্যাশ অন ডেলিভারিতে পাঠাও রাইডারকে দিবেন।
                </p>
              </div>

              {/* Payment Method Selector Tabs */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("bkash")}
                  className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                    paymentMethod === "bkash"
                      ? "border-pink-600 bg-pink-50/50 ring-2 ring-pink-500/30"
                      : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100/60"
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-pink-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                    ৳
                  </div>
                  <div>
                    <strong className="text-xs text-zinc-950 block">বিকাশ ক্যাশ আউট</strong>
                    <span className="text-[11px] text-pink-700 font-semibold">এজেন্ট নম্বরে ক্যাশ আউট</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("bank")}
                  className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                    paymentMethod === "bank"
                      ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/30"
                      : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100/60"
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-700 text-white flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="text-xs text-zinc-950 block">ব্যাংক ট্রান্সফার</strong>
                    <span className="text-[11px] text-blue-700 font-semibold">DBBL / City / BRAC</span>
                  </div>
                </button>
              </div>

              {/* Tab 1: bKash Agent Cashout Option */}
              {paymentMethod === "bkash" && (
                <div className="p-4 rounded-xl bg-pink-50/40 border border-pink-200/70 space-y-4 animate-in fade-in-50 duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-pink-200 shadow-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-pink-700 block">
                        বিকাশ এজেন্ট নম্বর (Cash Out Only)
                      </span>
                      <span className="font-mono text-lg font-black text-zinc-950 tracking-wider">
                        01879388902
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyBkash}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-lg transition-all active:scale-95 shadow-xs"
                    >
                      {copiedBkash ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>কপি হয়েছে!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>নম্বর কপি করুন</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Instructions */}
                  <div className="text-[11px] text-zinc-600 space-y-1 bg-white/70 p-3 rounded-lg border border-pink-100">
                    <p className="font-bold text-pink-900">ক্যাশ আউট করার নিয়মাবলী:</p>
                    <ol className="list-decimal list-inside space-y-0.5 text-zinc-700 pl-1">
                      <li>আপনার বিকাশ অ্যাপ অথবা <strong>*247#</strong> ডায়াল করে <strong>Cash Out</strong> অপশনে যান।</li>
                      <li>এজেন্ট নম্বর দিন: <strong className="font-mono text-zinc-950">01879388902</strong></li>
                      <li>টাকার পরিমাণ: <strong className="text-pink-700 font-bold">৳{shippingFee} টাকা</strong> (পাঠাও ডেলিভারি চার্জ)।</li>
                      <li>ক্যাশ আউট সম্পন্ন হলে যে নম্বর থেকে পাঠিয়েছেন এবং TrxID নিচে লিখুন।</li>
                    </ol>
                  </div>

                  {/* Verification Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-bold text-zinc-900 block mb-1">
                        আপনার বিকাশ নম্বর (যে নম্বর থেকে পাঠিয়েছেন) *
                      </label>
                      <input
                        type="text"
                        required={paymentMethod === "bkash"}
                        placeholder="01XXXXXXXXX"
                        value={senderBkashNumber}
                        onChange={(e) => {
                          setSenderBkashNumber(e.target.value);
                          if (fieldErrors.senderBkashNumber) setFieldErrors((p) => ({ ...p, senderBkashNumber: "" }));
                        }}
                        className={`w-full rounded-xl px-3.5 py-2.5 text-zinc-900 focus:outline-none focus:ring-1 font-mono ${
                          fieldErrors.senderBkashNumber
                            ? "bg-red-50/30 border border-red-500 focus:ring-pink-600"
                            : "bg-white border border-zinc-200 focus:ring-pink-600"
                        }`}
                      />
                      {fieldErrors.senderBkashNumber && (
                        <p className="text-[11px] text-red-600 font-semibold mt-1">{fieldErrors.senderBkashNumber}</p>
                      )}
                    </div>

                    <div>
                      <label className="font-bold text-zinc-900 block mb-1">
                        বিকাশ TrxID (Transaction ID) *
                      </label>
                      <input
                        type="text"
                        required={paymentMethod === "bkash"}
                        placeholder="যেমন: BL72XK9M1"
                        value={bkashTrxId}
                        onChange={(e) => {
                          setBkashTrxId(e.target.value.toUpperCase());
                          if (fieldErrors.bkashTrxId) setFieldErrors((p) => ({ ...p, bkashTrxId: "" }));
                        }}
                        className={`w-full rounded-xl px-3.5 py-2.5 text-zinc-900 focus:outline-none focus:ring-1 font-mono uppercase ${
                          fieldErrors.bkashTrxId
                            ? "bg-red-50/30 border border-red-500 focus:ring-pink-600"
                            : "bg-white border border-zinc-200 focus:ring-pink-600"
                        }`}
                      />
                      {fieldErrors.bkashTrxId && (
                        <p className="text-[11px] text-red-600 font-semibold mt-1">{fieldErrors.bkashTrxId}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Bank Transfer (3 Banks from image) */}
              {paymentMethod === "bank" && (
                <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-200/70 space-y-4 animate-in fade-in-50 duration-200">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-blue-900 block">
                      পছন্দের ব্যাংক একাউন্ট সিলেক্ট করুন (MOTOPLEX Official Bank Accounts):
                    </span>
                  </div>

                  {/* 3 Bank selector buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {(["DBBL", "City", "BRAC"] as const).map((bKey) => {
                      const b = BANK_DETAILS[bKey];
                      const isSelected = selectedBank === bKey;
                      return (
                        <div
                          key={bKey}
                          onClick={() => setSelectedBank(bKey)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                            isSelected
                              ? "border-blue-600 bg-white ring-2 ring-blue-500/30 shadow-xs"
                              : "border-zinc-200 bg-white hover:border-zinc-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-black text-xs text-zinc-950 block">{b.badge}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 font-bold" />}
                          </div>
                          <span className="text-[10px] text-zinc-500 block mt-1">হিসাব নম্বর:</span>
                          <span className="font-mono font-bold text-xs text-blue-900 block mt-0.5">
                            {b.accountNumber}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Active Bank Card details */}
                  {selectedBank && (
                    <div className="p-3.5 bg-white rounded-xl border border-blue-200 space-y-2 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-2">
                        <div>
                          <span className="text-[10px] text-zinc-500 uppercase font-bold block">ব্যাংকের নাম</span>
                          <span className="font-bold text-zinc-900">{BANK_DETAILS[selectedBank].bankName}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 uppercase font-bold block">হিসাবের নাম</span>
                          <span className="font-mono font-black text-zinc-900 text-sm">MOTOPLEX</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <span className="text-[10px] text-zinc-500 uppercase font-bold block">অ্যাকাউন্ট নম্বর</span>
                          <span className="font-mono font-black text-base text-blue-700 tracking-wider">
                            {BANK_DETAILS[selectedBank].accountNumber}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyBank(
                              BANK_DETAILS[selectedBank].accountNumber,
                              BANK_DETAILS[selectedBank].bankName
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 transition-colors"
                        >
                          {copiedBankAcc === BANK_DETAILS[selectedBank].accountNumber ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>কপি হয়েছে</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>কপি</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Bank verification inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-bold text-zinc-900 block mb-1">
                        টাকা জমাদানকারী / প্রেরকের নাম *
                      </label>
                      <input
                        type="text"
                        placeholder="আপনার নাম বা ব্যাংক একাউন্ট নাম"
                        value={depositorName}
                        onChange={(e) => setDepositorName(e.target.value)}
                        className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-zinc-900 block mb-1">
                        ব্যাংক TrxID / ডিপোজিট রেফারেন্স নম্বর *
                      </label>
                      <input
                        type="text"
                        required={paymentMethod === "bank"}
                        placeholder="ডিপোজিট স্লিপ বা রেফারেন্স নম্বর"
                        value={bankTrxRef}
                        onChange={(e) => {
                          setBankTrxRef(e.target.value.toUpperCase());
                          if (fieldErrors.bankTrxRef) setFieldErrors((p) => ({ ...p, bankTrxRef: "" }));
                        }}
                        className={`w-full rounded-xl px-3.5 py-2.5 text-zinc-900 focus:outline-none focus:ring-1 font-mono uppercase ${
                          fieldErrors.bankTrxRef
                            ? "bg-red-50/30 border border-red-500 focus:ring-blue-600"
                            : "bg-white border border-zinc-200 focus:ring-blue-600"
                        }`}
                      />
                      {fieldErrors.bankTrxRef && (
                        <p className="text-[11px] text-red-600 font-semibold mt-1">{fieldErrors.bankTrxRef}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Summary Sidebar */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-5 sticky top-28">
              <h2 className="text-sm font-black text-zinc-950 uppercase tracking-wider pb-3 border-b border-zinc-200">
                অর্ডার সামারি ({items.length} {items.length === 1 ? "Item" : "Items"})
              </h2>

              {/* Items List */}
              <div className="max-h-56 overflow-y-auto divide-y divide-zinc-100 pr-1 space-y-2">
                {items.map((item, idx) => {
                  const itemPrice = item.selectedVariant?.price ?? item.product.price;
                  return (
                    <div key={idx} className="flex gap-3 py-2 items-center">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-zinc-100 shrink-0 border border-zinc-200">
                        <Image src={item.product.images?.[0] || "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=600&auto=format&fit=crop"} alt="" fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0 text-xs">
                        <h4 className="font-bold text-zinc-900 truncate">{item.product.name}</h4>
                        <p className="text-[11px] text-zinc-500">
                          Qty: {item.quantity} {item.selectedSize && `• Size: ${item.selectedSize}`} {item.selectedColor && `• Color: ${item.selectedColor}`}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-zinc-950">
                        ৳{(itemPrice * item.quantity).toLocaleString("en-BD")}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Price Calculation Breakdown */}
              <div className="space-y-2.5 pt-3 border-t border-zinc-200 text-xs">
                <div className="flex justify-between text-zinc-600">
                  <span>পার্টস ও প্রোডাক্টের মূল্য (Subtotal)</span>
                  <span className="font-bold text-zinc-950 font-mono tabular-nums">৳{subtotal.toLocaleString("en-BD")}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>ডিসকাউন্ট</span>
                    <span className="font-bold font-mono tabular-nums">-৳{discount.toLocaleString("en-BD")}</span>
                  </div>
                )}

                <div className="flex justify-between text-zinc-600">
                  <span>পাঠাও কুরিয়ার ডেলিভারি চার্জ ({isDhakaCity ? "ঢাকা সিটি" : "সারা বাংলাদেশ"})</span>
                  <span className="font-bold text-zinc-950 font-mono tabular-nums">৳{shippingFee}</span>
                </div>

                {/* Clear advance vs COD breakdown */}
                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5 mt-2">
                  <div className="flex justify-between text-zinc-700">
                    <span className="font-bold text-red-600">১. এখন প্রদেয় (অগ্রিম কুরিয়ার চার্জ):</span>
                    <span className="font-black text-red-600 font-mono tabular-nums">৳{shippingFee}</span>
                  </div>
                  <div className="flex justify-between text-zinc-700">
                    <span className="font-bold text-zinc-900">২. ডেলিভারির সময় প্রদেয় (ক্যাশ অন ডেলিভারি):</span>
                    <span className="font-black text-zinc-950 font-mono tabular-nums">৳{subtotal.toLocaleString("en-BD")}</span>
                  </div>
                </div>

                <div className="flex justify-between text-base font-black text-zinc-950 pt-2 border-t border-zinc-200">
                  <span>সর্বমোট অর্ডারের মূল্য</span>
                  <span className="font-mono tabular-nums">৳{total.toLocaleString("en-BD")}</span>
                </div>
              </div>

              {/* Place Order CTA */}
              <button
                type="submit"
                disabled={isSubmitting || items.length === 0}
                className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-extrabold text-sm py-4 px-6 rounded-2xl shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-98"
              >
                {isSubmitting ? (
                  <span>অর্ডার প্রসেস হচ্ছে...</span>
                ) : (
                  <>
                    <span>অগ্রিম ৳{shippingFee} জমা দিয়ে অর্ডার কনফার্ম করুন</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="space-y-1.5 pt-1 text-center">
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-600">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>অফিসিয়াল মটোপ্লেক্স জেনুইন পার্টস গ্যারান্টি</span>
                </div>
                <p className="text-[10px] text-zinc-500">
                  কুরিয়ার চার্জ পরিশোধের তথ্য যাচাই শেষে পাঠাও কুরিয়ারে পার্সেল বুকিং হবে।
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
