











































































import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Order } from "@/models";
import { getCurrentUser } from "@/lib/auth";
import { getStoredOrders } from "@/lib/orderStore";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params;
  let user = null;
  try {
    user = await getCurrentUser();
  } catch { }

  try {
    await connectDB();

    const filter: Record<string, unknown> = { orderNumber };
    if (user?.role === "user") {
      filter.userId = user._id;
    }

    const order = await Order.findOne(filter).lean();

    if (order) {
      return NextResponse.json({
        success: true,
        data: { order },
      });
    }
  } catch {
    // Database offline, fall back to persistent order store
  }

  const allStored = getStoredOrders();
  const storedOrder = allStored.find(
    (o) =>
      o.orderNumber?.toLowerCase() === orderNumber.toLowerCase() ||
      o.id?.toLowerCase() === orderNumber.toLowerCase()
  );

  if (!storedOrder) {
    return NextResponse.json(
      { success: false, message: "Order not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: { order: storedOrder },
  });
}
