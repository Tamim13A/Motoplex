import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Order } from "@/models";
import { getStoredOrders } from "@/lib/orderStore";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "100");
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  // 1. Try fetching from MongoDB if connected
  try {
    await connectDB();
    const filter: Record<string, unknown> = {};
    if (status && status !== "all") {
      filter.orderStatus = { $regex: new RegExp(`^${status}$`, "i") };
    }
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { "customerInfo.phone": { $regex: search, $options: "i" } },
        { "customerInfo.fullName": { $regex: search, $options: "i" } },
        { "shippingAddress.phone": { $regex: search, $options: "i" } },
        { "shippingAddress.fullName": { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const [dbOrders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);

    if (dbOrders && dbOrders.length > 0) {
      const totalPages = Math.ceil(total / limit);
      return NextResponse.json({
        success: true,
        data: {
          orders: dbOrders,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
      });
    }
  } catch {
    // Database offline, proceed to persistent order store
  }

  // 2. Fallback to resilient file-backed OrderStore
  let stored = getStoredOrders();

  if (status && status !== "all") {
    stored = stored.filter(
      (o) => o.status.toLowerCase() === status.toLowerCase()
    );
  }

  if (search) {
    const q = search.toLowerCase();
    stored = stored.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.shippingAddress?.fullName?.toLowerCase().includes(q) ||
        o.shippingAddress?.phone?.includes(q) ||
        o.items?.some((i) => i.productName?.toLowerCase().includes(q))
    );
  }

  const total = stored.length;
  const skip = (page - 1) * limit;
  const paginatedOrders = stored.slice(skip, skip + limit);
  const totalPages = Math.ceil(total / limit) || 1;

  return NextResponse.json({
    success: true,
    data: {
      orders: paginatedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    },
  });
}
