import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import { Product, Order } from "@/models";
import { getCurrentUser } from "@/lib/auth";
import { sendTelegramOrderNotification } from "@/lib/telegram";
import { createStoredOrder } from "@/lib/orderStore";
import { products as fallbackCatalog } from "@/data/products";
import mongoose from "mongoose";
import { invalidateProductsCache } from "@/app/api/products/route";

const orderItemSchema = z.object({
  productId: z.string().min(1, "প্রোডাক্ট সিলেক্ট করা হয়নি (Product ID is required)"),
  variantId: z.string().optional(),
  quantity: z.coerce.number().min(1, "পণ্যের পরিমাণ অন্তত ১ হতে হবে (Quantity must be at least 1)"),
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "চেকআউট করার জন্য কার্টে অন্তত ১টি পণ্য থাকতে হবে"),
  shippingAddress: z.object({
    fullName: z.string().min(1, "আপনার পূর্ণ নাম লিখুন (Full name is required)"),
    phone: z.string().min(6, "সঠিক মোবাইল নম্বর লিখুন (Valid phone number is required)"),
    division: z.string().optional().default("Dhaka"),
    district: z.string().optional().default("Dhaka"),
    area: z.string().optional().default("General Area"),
    address: z.string().optional().default("Showroom / Courier Point Address"),
  }),
  deliveryMethod: z.string().optional().default("Pathao Express"),
  paymentMethod: z.string().optional().default("bKash Agent Cash Out"),
  paymentDetails: z
    .object({
      advancePaymentMethod: z.string().optional().default("bKash Agent Cash Out"),
      advanceAmount: z.coerce.number().optional(),
      senderNumber: z.string().optional(),
      trxId: z.string().optional(),
      bankName: z.string().optional(),
      accountNumber: z.string().optional(),
      reference: z.string().optional(),
    })
    .optional(),
  couponCode: z.string().optional(),
  customerInfo: z
    .object({
      email: z.string().optional(),
      phone: z.string().optional(),
      fullName: z.string().optional(),
    })
    .optional(),
});

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `MPX-${timestamp}${random}`;
}

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON body format" }, { status: 400 });
  }

  // Pre-process and sanitize payload to prevent validation rejection on minor formatting
  if (body && typeof body === "object") {
    if (body.shippingAddress && typeof body.shippingAddress === "object") {
      const sa = body.shippingAddress;
      if (typeof sa.fullName === "string") sa.fullName = sa.fullName.trim();
      if (typeof sa.phone === "string") {
        const rawDigits = sa.phone.replace(/\D/g, "");
        if (rawDigits.length === 10 && rawDigits.startsWith("1")) {
          sa.phone = `0${rawDigits}`;
        } else if (rawDigits.startsWith("880") && rawDigits.length === 13) {
          sa.phone = `0${rawDigits.slice(3)}`;
        } else if (rawDigits.length >= 6) {
          sa.phone = rawDigits;
        }
      }
      if (!sa.address || typeof sa.address !== "string" || sa.address.trim().length === 0) {
        sa.address =
          [sa.area, sa.district, sa.division].filter(Boolean).join(", ") ||
          "Showroom / Courier Point Address";
      }
    }

    // Ensure items array has valid IDs
    if (Array.isArray(body.items)) {
      body.items = body.items.map((it: any) => ({
        ...it,
        productId: (it.productId || it.id || it.slug || "motoplex-part").toString(),
        quantity: Math.max(1, Number(it.quantity) || 1),
      }));
    }
  }

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    const errorDetails = parsed.error.issues
      .map((i) => i.message)
      .filter(Boolean)
      .join(" • ");
    console.error("[API/orders] Validation error:", errorDetails, JSON.stringify(parsed.error.flatten().fieldErrors));
    return NextResponse.json(
      {
        success: false,
        message: errorDetails || "ফর্মের তথ্যাবলীতে অসম্পূর্ণতা রয়েছে। অনুগ্রহ করে যাচাই করে পুনরায় চেষ্টা করুন।",
        errors: parsed.error.flatten().fieldErrors,
        issues: parsed.error.issues,
      },
      { status: 400 }
    );
  }

  const validatedData = parsed.data;

  // Auto-normalize Bangladesh phone numbers
  const rawPhone = (validatedData.shippingAddress.phone || "").trim();
  const digitsOnly = rawPhone.replace(/\D/g, "");
  const normalizedPhone =
    digitsOnly.length === 10 && digitsOnly.startsWith("1")
      ? `0${digitsOnly}`
      : digitsOnly.startsWith("880") && digitsOnly.length === 13
      ? `0${digitsOnly.slice(3)}`
      : rawPhone;

  validatedData.shippingAddress.phone = normalizedPhone;

  // Auto-fill address if empty or too short so validation never blocks legitimate orders
  if (!validatedData.shippingAddress.address || validatedData.shippingAddress.address.trim().length < 2) {
    validatedData.shippingAddress.address =
      [
        validatedData.shippingAddress.area,
        validatedData.shippingAddress.district,
        validatedData.shippingAddress.division,
      ]
        .filter(Boolean)
        .join(", ") || "Showroom / Counter Delivery Address";
  }

  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    // Ignore offline auth
  }

  let customerInfo = validatedData.customerInfo;
  if (user && !customerInfo) {
    customerInfo = {
      fullName: user.name,
      email: user.email,
      phone: user.phone || normalizedPhone,
    };
  }

  const safeCustomerInfo = {
    fullName: customerInfo?.fullName || validatedData.shippingAddress.fullName || "Valued Customer",
    phone: customerInfo?.phone || normalizedPhone,
    email: customerInfo?.email || "customer@motoplexbd.com",
  };

  const isInsideDhaka =
    (validatedData.shippingAddress.district || "").trim().toLowerCase() === "dhaka" ||
    (validatedData.shippingAddress.division || "").trim().toLowerCase() === "dhaka";
  const shippingFee = isInsideDhaka ? 80 : 130;
  const advancePaid = shippingFee;
  const safeDeliveryMethod = isInsideDhaka
    ? "Pathao Express (Inside Dhaka - ৳80)"
    : "Pathao Express (All Bangladesh - ৳130)";

  // Check if MongoDB is connected
  let isDbConnected = false;
  try {
    await connectDB();
    isDbConnected = true;
  } catch {
    isDbConnected = false;
  }

  const orderNumber = generateOrderNumber();

  // 1. If MongoDB is connected and accessible
  if (isDbConnected) {
    let session: mongoose.ClientSession | null = null;
    let useTransaction = false;

    try {
      try {
        session = await mongoose.startSession();
        session.startTransaction();
        useTransaction = true;
      } catch {
        session = null;
        useTransaction = false;
      }

      const productIds = validatedData.items.map((item) => item.productId);
      const objectIdList = productIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
      const strIdList = productIds.filter((id) => !mongoose.Types.ObjectId.isValid(id));
      const orClauses: any[] = [];
      if (objectIdList.length > 0) orClauses.push({ _id: { $in: objectIdList } });
      if (strIdList.length > 0) {
        orClauses.push({ slug: { $in: strIdList } });
        orClauses.push({ sku: { $in: strIdList } });
      }

      let dbProducts: any[] = [];
      if (orClauses.length > 0) {
        dbProducts = session
          ? await Product.find({ $or: orClauses }).session(session)
          : await Product.find({ $or: orClauses });
      }

      if (dbProducts.length > 0) {
        const productMap = new Map();
        for (const p of dbProducts) {
          productMap.set(p._id.toString(), p);
          if (p.slug) productMap.set(p.slug, p);
          if (p.sku) productMap.set(p.sku, p);
        }
        let subtotal = 0;
        const orderItems = [];

        for (const item of validatedData.items) {
          const product = productMap.get(item.productId);
          if (!product) continue;
          let variant = product.variants?.[0];
          if (item.variantId) {
            const foundVariant = product.variants?.find(
              (v: any) => v.sku === item.variantId || v._id?.toString() === item.variantId
            );
            if (foundVariant) variant = foundVariant;
          }

          const price = variant?.price ?? product.price;
          subtotal += price * item.quantity;

          // Auto-deduct current stock in MongoDB based on customer order quantity
          const newStock = Math.max(0, (product.stock || 0) - item.quantity);
          product.stock = newStock;
          if (variant && typeof variant.stock === "number") {
            variant.stock = Math.max(0, variant.stock - item.quantity);
          }
          await Product.updateOne(
            { _id: product._id },
            {
              $set: {
                stock: newStock,
                variants: product.variants,
              },
            },
            session ? { session } : undefined
          );

          orderItems.push({
            productId: product._id,
            variantId: variant?.sku || "STD",
            name: product.name,
            sku: variant?.sku || product.sku,
            price,
            quantity: item.quantity,
            image: product.images?.[0] || "/images/products/aprilia-rs660-1.png",
            variantDetails: {
              size: variant?.size,
              color: variant?.color,
              material: variant?.material,
            },
          });
        }

        const total = subtotal + shippingFee;
        const dueAmount = subtotal;

        const dbOrder = await Order.create(
          [
            {
              orderNumber,
              userId: user ? user._id : undefined,
              customerInfo: safeCustomerInfo,
              shippingAddress: validatedData.shippingAddress,
              items: orderItems,
              subtotal,
              shippingFee,
              advancePaid,
              dueAmount,
              discount: 0,
              total,
              deliveryMethod: safeDeliveryMethod,
              paymentMethod: validatedData.paymentMethod || "Advance Delivery Fee + COD",
              paymentDetails: validatedData.paymentDetails,
              paymentStatus: "unpaid",
              orderStatus: "Pending",
              stockDeducted: true,
              courierInfo: {
                name: "Pathao",
              },
            },
          ],
          session ? { session } : undefined
        );

        if (session && useTransaction) {
          await session.commitTransaction();
        }

        invalidateProductsCache();

        const created = dbOrder[0];

        // Format for unified store & Telegram
        const unifiedOrder = {
          id: created._id.toString(),
          orderNumber: created.orderNumber,
          date: new Date().toLocaleDateString("en-GB"),
          status: "Pending" as const,
          items: orderItems.map((it) => ({
            productId: it.productId.toString(),
            productName: it.name,
            productImage: it.image,
            variantInfo: [it.variantDetails?.size, it.variantDetails?.color, it.variantDetails?.material]
              .filter(Boolean)
              .join(" / ") || "Standard",
            price: it.price,
            quantity: it.quantity,
            total: it.price * it.quantity,
          })),
          subtotal,
          shippingFee,
          advancePaid,
          dueAmount,
          discount: 0,
          total,
          shippingAddress: validatedData.shippingAddress,
          deliveryMethod: safeDeliveryMethod,
          paymentMethod: validatedData.paymentMethod || "Advance Delivery Fee + COD",
          paymentDetails: validatedData.paymentDetails,
          paymentStatus: "Pending" as const,
          courierName: "Pathao" as const,
        };

        // Persist to unified store
        createStoredOrder(unifiedOrder);

        // Telegram Notification
        sendTelegramOrderNotification({
          orderNumber: unifiedOrder.orderNumber,
          customerInfo: safeCustomerInfo,
          shippingAddress: validatedData.shippingAddress,
          items: unifiedOrder.items.map((i) => ({
            name: i.productName,
            quantity: i.quantity,
            price: i.price,
            image: i.productImage,
          })),
          subtotal,
          shippingFee,
          advancePaid,
          dueAmount,
          discount: 0,
          total,
          deliveryMethod: safeDeliveryMethod,
          paymentMethod: validatedData.paymentMethod || "Advance Delivery Fee + COD",
          paymentDetails: validatedData.paymentDetails,
        }).catch((err) => console.error("[Telegram] Error:", err));

        return NextResponse.json(
          {
            success: true,
            message: "Order placed successfully",
            data: { order: unifiedOrder },
          },
          { status: 201 }
        );
      }
    } catch (dbErr) {
      if (session && useTransaction) {
        try {
          await session.abortTransaction();
        } catch {}
      }
      console.warn("[API/orders] MongoDB operation failed, falling back to resilient order store:", dbErr);
    } finally {
      if (session) {
        await session.endSession();
      }
    }
  }

  // 2. Resilient Fallback (Used when MongoDB is offline or in local demo mode)
  let subtotal = 0;
  const resolvedItems = validatedData.items.map((item) => {
    const catalogItem = fallbackCatalog.find(
      (p) =>
        p.id === item.productId ||
        p.slug === item.productId ||
        p.sku === item.productId
    );

    let price = 1500;
    let name = "Motoplex Motorcycle Genuine Part";
    let image = "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=300&auto=format&fit=crop";
    let variantInfo = "Standard";

    if (catalogItem) {
      name = catalogItem.name;
      image = catalogItem.images[0] || image;
      const variant = item.variantId
        ? catalogItem.variants.find((v) => v.sku === item.variantId || v.id === item.variantId)
        : catalogItem.variants[0];

      price = variant ? variant.price : catalogItem.price;
      if (variant) {
        variantInfo = variant.name || variant.color || "Standard";
      }
    }

    const itemTotal = price * item.quantity;
    subtotal += itemTotal;

    return {
      productId: item.productId,
      productName: name,
      productImage: image,
      variantInfo,
      price,
      quantity: item.quantity,
      total: itemTotal,
    };
  });

  const total = subtotal + shippingFee;
  const dueAmount = subtotal;

  const newOrder = {
    id: `ord-${Date.now()}`,
    orderNumber,
    date: new Date().toLocaleDateString("en-GB"),
    status: "Pending" as const,
    items: resolvedItems,
    subtotal,
    shippingFee,
    advancePaid,
    dueAmount,
    discount: 0,
    total,
    shippingAddress: validatedData.shippingAddress,
    deliveryMethod: safeDeliveryMethod,
    paymentMethod: validatedData.paymentMethod || "Advance Delivery Fee + COD",
    paymentDetails: validatedData.paymentDetails,
    paymentStatus: "Pending" as const,
    courierName: "Pathao" as const,
  };

  // Save to persistent file store
  createStoredOrder(newOrder);

  // Synchronize stock deduction in MongoDB
  try {
    await connectDB();
    for (const item of validatedData.items) {
      const query = mongoose.Types.ObjectId.isValid(item.productId)
        ? { _id: item.productId }
        : { $or: [{ slug: item.productId }, { sku: item.productId }] };
      const p = await Product.findOne(query);
      if (p) {
        p.stock = Math.max(0, (p.stock || 0) - item.quantity);
        await p.save();
      }
    }
  } catch (err) {
    console.warn("[API/orders] Stock deduction sync skipped in fallback:", err);
  }

  // Dispatch Telegram Bot Notification
  sendTelegramOrderNotification({
    orderNumber: newOrder.orderNumber,
    customerInfo: safeCustomerInfo,
    shippingAddress: validatedData.shippingAddress,
    items: resolvedItems.map((i) => ({
      name: i.productName,
      quantity: i.quantity,
      price: i.price,
      image: i.productImage,
    })),
    subtotal,
    shippingFee,
    advancePaid,
    dueAmount,
    discount: 0,
    total,
    deliveryMethod: safeDeliveryMethod,
    paymentMethod: validatedData.paymentMethod || "Advance Delivery Fee + COD",
    paymentDetails: validatedData.paymentDetails,
  }).catch((err) => console.error("[Telegram] Error:", err));

  return NextResponse.json(
    {
      success: true,
      message: "Order placed successfully",
      data: { order: newOrder },
    },
    { status: 201 }
  );
}
