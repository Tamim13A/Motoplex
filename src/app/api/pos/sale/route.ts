import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Order, Product } from "@/models";
import { sendTelegramPosSaleNotification } from "@/lib/telegram";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderNumber,
      items,
      customerName,
      customerPhone,
      subtotal,
      discount,
      grandTotal,
      paymentMethod,
      paidAmount,
      changeAmount,
      dueAmount,
    } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cart items cannot be empty." },
        { status: 400 }
      );
    }

    await connectDB();

    const safeOrderNo =
      orderNumber || `POS-${Math.floor(100000 + Math.random() * 900000)}`;

    // Decrement stock for inventory accuracy
    for (const item of items) {
      if (item.productId) {
        try {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { stock: -Math.abs(item.quantity || 1) },
          });
        } catch (stockErr) {
          console.warn("[POS Stock Decrement] Warning:", stockErr);
        }
      }
    }

    // Save into Orders collection
    const orderDoc = await Order.create({
      orderNumber: safeOrderNo,
      customerInfo: {
        fullName: customerName?.trim() || "Showroom Walk-in Customer",
        phone: customerPhone?.trim() || "N/A",
        email: "pos@motoplexbd.com",
      },
      shippingAddress: {
        fullName: customerName?.trim() || "Showroom Walk-in Customer",
        phone: customerPhone?.trim() || "N/A",
        division: "Dhaka",
        district: "Dhaka",
        area: "Gulshan-2",
        address: "Motoplex Flagship Counter Sale",
      },
      items: items.map((i: any) => ({
        productId: i.productId || "pos-item",
        name: i.name,
        sku: i.sku || "POS-ITEM",
        price: Number(i.price) || 0,
        quantity: Number(i.quantity) || 1,
        image: i.image || "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=300",
        variantDetails: i.variantInfo ? { size: i.variantInfo } : undefined,
      })),
      subtotal: Number(subtotal) || 0,
      shippingFee: 0,
      advancePaid: Number(paidAmount) || Number(grandTotal) || 0,
      dueAmount: Number(dueAmount) || 0,
      discount: Number(discount) || 0,
      total: Number(grandTotal) || 0,
      deliveryMethod: "Showroom POS Counter",
      paymentMethod: `Showroom POS (${paymentMethod || "Cash"})`,
      paymentStatus: Number(dueAmount) > 0 ? "unpaid" : "paid",
      orderStatus: "Delivered",
      courierInfo: {
        name: "Pathao",
        status: "Counter Direct Handover",
      },
    });

    // Instant dispatch to Motoplex Telegram Group
    try {
      await sendTelegramPosSaleNotification({
        orderNumber: safeOrderNo,
        customerName: customerName || "Walk-in Customer",
        customerPhone: customerPhone || "N/A",
        branchName: "Gulshan-2 Flagship (Counter #01)",
        items: items.map((i: any) => ({
          name: i.name,
          quantity: Number(i.quantity) || 1,
          price: Number(i.price) || 0,
          image: i.image,
          sku: i.sku,
          variantInfo: i.variantInfo,
        })),
        subtotal: Number(subtotal) || 0,
        discount: Number(discount) || 0,
        grandTotal: Number(grandTotal) || 0,
        paymentMethod: paymentMethod || "Cash",
        paidAmount: Number(paidAmount) || 0,
        changeAmount: Number(changeAmount) || 0,
        dueAmount: Number(dueAmount) || 0,
        createdAt: orderDoc.createdAt,
      });
    } catch (tgErr) {
      console.warn("[POS Telegram Notification Error]:", tgErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: "POS counter sale completed and admin bot notified.",
        order: orderDoc,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[POS Sale API Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process POS sale" },
      { status: 500 }
    );
  }
}

