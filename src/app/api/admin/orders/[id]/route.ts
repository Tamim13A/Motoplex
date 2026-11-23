import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Order, Product } from "@/models";
import { updateStoredOrderStatus, getStoredOrders, saveStoredOrders } from "@/lib/orderStore";
import mongoose from "mongoose";
import { invalidateProductsCache } from "@/app/api/products/route";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Try MongoDB
  try {
    await connectDB();
    const orderQuery = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { orderNumber: id };
    const order = await Order.findOne(orderQuery).lean();
    if (order) {
      return NextResponse.json({ success: true, data: { order } });
    }
  } catch {
    // Ignore DB offline
  }

  // Fallback to orderStore
  const orders = getStoredOrders();
  const order = orders.find((o) => o.id === id || o.orderNumber === id);
  if (!order) {
    return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: { order } });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const newStatus = (body.orderStatus || body.status || "Processing") as
      | "Pending"
      | "Confirmed"
      | "Processing"
      | "Shipped"
      | "Delivered"
      | "Cancelled";

    const isNewCancelled = newStatus.toLowerCase() === "cancelled";

    let updatedDbOrder = null;
    let orderItems: Array<{
      productId?: any;
      quantity?: number;
      sku?: string;
      variantSku?: string;
      name?: string;
      productName?: string;
    }> = [];

    // 1. Authoritative DB Lookup
    try {
      await connectDB();
      const orderQuery = mongoose.Types.ObjectId.isValid(id)
        ? { $or: [{ _id: id }, { orderNumber: id }] }
        : { orderNumber: id };

      const dbOrder = await Order.findOne(orderQuery);
      if (dbOrder) {
        if (Array.isArray(dbOrder.items) && dbOrder.items.length > 0) {
          orderItems = dbOrder.items;
        }

        const stockWasDeducted = dbOrder.stockDeducted !== false;

        // CASE A: Order is being CANCELLED and stock was previously deducted -> Restore stock exactly once
        if (isNewCancelled && stockWasDeducted) {
          for (const it of orderItems) {
            const qty = Number(it.quantity) || 1;
            const prodId = it.productId?.toString() || "";

            const prodQuery = mongoose.Types.ObjectId.isValid(prodId)
              ? { _id: prodId }
              : {
                  $or: [
                    { slug: prodId },
                    { sku: it.sku || prodId },
                    { name: it.productName || it.name },
                  ],
                };

            const prod = await Product.findOne(prodQuery);
            if (prod) {
              prod.stock = (prod.stock || 0) + qty;
              const vSku = it.variantSku || it.sku;
              if (vSku && Array.isArray(prod.variants)) {
                const variant = prod.variants.find(
                  (v: any) => v.sku === vSku || v._id?.toString() === vSku
                );
                if (variant && typeof variant.stock === "number") {
                  variant.stock = (variant.stock || 0) + qty;
                }
              }
              prod.markModified("variants");
              await prod.save();
            }
          }
          dbOrder.stockDeducted = false;
          invalidateProductsCache();
        }
        // CASE B: Order was CANCELLED and is now being RE-ACTIVATED -> Re-deduct stock exactly once
        else if (!isNewCancelled && !stockWasDeducted) {
          for (const it of orderItems) {
            const qty = Number(it.quantity) || 1;
            const prodId = it.productId?.toString() || "";

            const prodQuery = mongoose.Types.ObjectId.isValid(prodId)
              ? { _id: prodId }
              : {
                  $or: [
                    { slug: prodId },
                    { sku: it.sku || prodId },
                    { name: it.productName || it.name },
                  ],
                };

            const prod = await Product.findOne(prodQuery);
            if (prod) {
              prod.stock = Math.max(0, (prod.stock || 0) - qty);
              const vSku = it.variantSku || it.sku;
              if (vSku && Array.isArray(prod.variants)) {
                const variant = prod.variants.find(
                  (v: any) => v.sku === vSku || v._id?.toString() === vSku
                );
                if (variant && typeof variant.stock === "number") {
                  variant.stock = Math.max(0, variant.stock - qty);
                }
              }
              prod.markModified("variants");
              await prod.save();
            }
          }
          dbOrder.stockDeducted = true;
          invalidateProductsCache();
        }

        dbOrder.orderStatus = newStatus;
        if (body.courierInfo?.name) {
          dbOrder.courierInfo = { ...dbOrder.courierInfo, ...body.courierInfo };
        }
        if (body.paymentStatus) {
          dbOrder.paymentStatus = body.paymentStatus;
        }
        await dbOrder.save();
        updatedDbOrder = dbOrder;
      }
    } catch (err) {
      console.warn("[API/admin/orders/[id]] MongoDB order sync warn:", err);
    }

    // 2. Always keep persistent OrderStore in sync
    const updatedStored = updateStoredOrderStatus(id, newStatus, body.courierInfo);

    return NextResponse.json({
      success: true,
      message: "Order updated successfully",
      data: { order: updatedStored || updatedDbOrder },
    });
  } catch (error) {
    console.error("[API/admin/orders/[id]] PATCH Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update order" },
      { status: 500 }
    );
  }
}
