import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Order } from "@/models";
import { getStoredOrders } from "@/lib/orderStore";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = (
    searchParams.get("q") ||
    searchParams.get("orderNumber") ||
    searchParams.get("phone") ||
    ""
  ).trim();

  if (!query) {
    return NextResponse.json(
      { success: false, message: "Please provide an Order Number or Phone Number." },
      { status: 400 }
    );
  }

  const cleanQ = query.toLowerCase();
  const cleanPhone = query.replace(/[^0-9]/g, "");

  let foundOrder: any = null;

  // 1. Search in MongoDB if connected
  try {
    await connectDB();
    const filter: Record<string, unknown> = {
      $or: [
        { orderNumber: { $regex: new RegExp(`^${query}$`, "i") } },
        { "customerInfo.phone": cleanPhone ? { $regex: cleanPhone } : query },
        { "shippingAddress.phone": cleanPhone ? { $regex: cleanPhone } : query },
      ],
    };

    foundOrder = await Order.findOne(filter).sort({ createdAt: -1 }).lean();
  } catch {
    // Database offline, check orderStore
  }

  // 2. Search in persistent OrderStore
  if (!foundOrder) {
    const allStored = getStoredOrders();
    foundOrder = allStored.find((o) => {
      const matchOrderNo = o.orderNumber?.toLowerCase() === cleanQ || o.id?.toLowerCase() === cleanQ;
      const orderPhone = (o.shippingAddress?.phone || "").replace(/[^0-9]/g, "");
      const matchPhone = cleanPhone.length >= 7 && (orderPhone.endsWith(cleanPhone) || cleanPhone.endsWith(orderPhone));
      return matchOrderNo || matchPhone;
    });
  }

  if (!foundOrder) {
    return NextResponse.json(
      {
        success: false,
        message: `No active shipment found matching "${query}". Please check the order number or phone number.`,
      },
      { status: 404 }
    );
  }

  // Normalize order fields
  const normalized = {
    id: foundOrder._id?.toString() || foundOrder.id || foundOrder.orderNumber,
    orderNumber: foundOrder.orderNumber,
    date: foundOrder.date || (foundOrder.createdAt ? new Date(foundOrder.createdAt).toLocaleDateString("en-GB") : new Date().toLocaleDateString("en-BD")),
    status: foundOrder.orderStatus || foundOrder.status || "Pending",
    total: Number(foundOrder.total || foundOrder.totalAmount || 0),
    subtotal: Number(foundOrder.subtotal || 0),
    shippingFee: Number(foundOrder.shippingFee || 0),
    paymentMethod: foundOrder.paymentMethod || "Cash on Delivery",
    paymentStatus: foundOrder.paymentStatus || "unpaid",
    deliveryMethod: foundOrder.deliveryMethod || "Standard Courier",
    courierName: foundOrder.courierName || foundOrder.courierInfo?.name || "Pathao",
    trackingNumber: foundOrder.trackingNumber || foundOrder.courierInfo?.trackingNumber || "PTH-PENDING",
    shippingAddress: {
      fullName: foundOrder.shippingAddress?.fullName || foundOrder.customerInfo?.fullName || "Valued Customer",
      phone: foundOrder.shippingAddress?.phone || foundOrder.customerInfo?.phone || "",
      division: foundOrder.shippingAddress?.division || "Dhaka",
      district: foundOrder.shippingAddress?.district || "Dhaka City",
      area: foundOrder.shippingAddress?.area || "Gulshan",
      address: foundOrder.shippingAddress?.address || "",
    },
    items: (foundOrder.items || []).map((it: any) => ({
      productId: it.productId?.toString() || "",
      productName: it.productName || it.name || "Parts Item",
      productImage: it.productImage || it.image || "",
      variantInfo: it.variantInfo || it.variantSku || "Standard",
      price: Number(it.price || 0),
      quantity: Number(it.quantity || 1),
      total: Number(it.total || 0),
    })),
  };

  // Courier direct link
  let courierDirectUrl = "";
  if (normalized.courierName === "Steadfast" && normalized.trackingNumber && normalized.trackingNumber !== "PTH-PENDING") {
    courierDirectUrl = `https://steadfast.com.bd/t/${normalized.trackingNumber}`;
  } else if (normalized.courierName === "Pathao") {
    courierDirectUrl = "https://pathao.com/courier/";
  } else if (normalized.courierName === "RedX") {
    courierDirectUrl = "https://redx.com.bd/";
  }

  // Build Real Tracking Milestones
  const currentStatus = normalized.status;
  const isCancelled = currentStatus === "Cancelled";

  const timeline = [
    {
      title: "Order Placed",
      titleBn: "অর্ডার গৃহীত হয়েছে",
      description: "Order received via Motoplex BD official portal with Cash on Delivery selection.",
      completed: true,
      current: currentStatus === "Pending",
      time: normalized.date,
    },
    {
      title: "Confirmed by Showroom HQ",
      titleBn: "শোরুম থেকে নিশ্চিতকরণ",
      description: "Verified by Motoplex operations team and customer contact verified.",
      completed: ["Confirmed", "Processing", "Shipped", "Delivered"].includes(currentStatus) && !isCancelled,
      current: currentStatus === "Confirmed",
      time: currentStatus === "Pending" ? "Expected shortly" : "Verified",
    },
    {
      title: "Genuine Quality Inspection & Packaged",
      titleBn: "কোয়ালিটি চেক ও প্যাকেজিং",
      description: "Sealed in protective tamper-proof packaging at Mirpur Central Warehouse.",
      completed: ["Processing", "Shipped", "Delivered"].includes(currentStatus) && !isCancelled,
      current: currentStatus === "Processing",
      time: ["Processing", "Shipped", "Delivered"].includes(currentStatus) ? "Completed" : "In queue",
    },
    {
      title: "Handed over to Courier Partner",
      titleBn: "কুরিয়ারে হস্তান্তর",
      description: `Dispatched with ${normalized.courierName} Express (Consignment ID: ${normalized.trackingNumber}).`,
      completed: ["Shipped", "Delivered"].includes(currentStatus) && !isCancelled,
      current: currentStatus === "Shipped",
      time: ["Shipped", "Delivered"].includes(currentStatus) ? "In Transit" : "Awaiting dispatch",
    },
    {
      title: "Out for Delivery & Cash Collection",
      titleBn: "ডেলিভারি ও ক্যাশ কালেকশন",
      description: `Rider delivering to ${normalized.shippingAddress.address}, ${normalized.shippingAddress.district}. Payment collected upon inspection.`,
      completed: currentStatus === "Delivered",
      current: currentStatus === "Delivered",
      time: currentStatus === "Delivered" ? "Delivered" : "Final Step",
    },
  ];

  return NextResponse.json({
    success: true,
    data: {
      order: normalized,
      timeline,
      courierDirectUrl,
      isCancelled,
    },
  });
}

