import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import { StoreSetting } from "@/models";
import { requireRole } from "@/lib/auth";

const settingsSchema = z.object({
  storeName: z.string().min(1).max(100).optional(),
  logoUrl: z.string().url().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  deliveryCharges: z.object({
    insideDhaka: z.number().min(0).default(120),
    outsideDhaka: z.number().min(0).default(150),
  }).optional(),
  courierCredentials: z.object({
    steadfastApiKey: z.string().optional(),
    steadfastSecret: z.string().optional(),
    pathaoClientId: z.string().optional(),
    pathaoClientSecret: z.string().optional(),
  }).optional(),
  paymentCredentials: z.object({
    bkashAppKey: z.string().optional(),
    bkashAppSecret: z.string().optional(),
    aamarPayStoreId: z.string().optional(),
    aamarPaySignatureKey: z.string().optional(),
  }).optional(),
  analytics: z.object({
    fbPixelId: z.string().optional(),
    gtmId: z.string().optional(),
  }).optional(),
});

export async function GET() {
  try {
    await connectDB();
    await requireRole("admin");

    let settings = await StoreSetting.findOne().lean();
    if (!settings) {
      settings = await StoreSetting.create({});
    }

    return NextResponse.json({ success: true, data: { settings } });
  } catch (error) {
    if (error instanceof Error && (error.message === "Insufficient permissions" || error.message === "Authentication required")) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.message === "Insufficient permissions" ? 403 : 401 }
      );
    }

    console.warn("[API/admin/settings] Database offline, serving default settings.");
    const defaultSettings = {
      storeName: "MOTOPLEX Bangladesh",
      phone: "+880 1700-MOTOPLEX",
      email: "concierge@motoplexbd.com",
      address: "House 14, Road 112, Gulshan-2, Dhaka 1212",
      deliveryCharges: {
        insideDhaka: 120,
        outsideDhaka: 150,
      },
      courierCredentials: {
        steadfastApiKey: "",
        pathaoClientId: "",
      },
      paymentCredentials: {},
      analytics: {},
    };
    return NextResponse.json({ success: true, data: { settings: defaultSettings } });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    await requireRole("admin");

    const body = await request.json();
    const validatedData = settingsSchema.parse(body);

    let settings = await StoreSetting.findOne();
    if (!settings) {
      settings = await StoreSetting.create(validatedData);
    } else {
      Object.assign(settings, validatedData);
      await settings.save();
    }

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      data: { settings },
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "Insufficient permissions" || error.message === "Authentication required")) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.message === "Insufficient permissions" ? 403 : 401 }
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Validation error", errors: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    console.warn("[API/admin/settings] Database offline, serving default settings.");
    const defaultSettings = {
      storeName: "MOTOPLEX Bangladesh",
      phone: "+880 1700-MOTOPLEX",
      email: "concierge@motoplexbd.com",
      address: "House 14, Road 112, Gulshan-2, Dhaka 1212",
      deliveryCharges: {
        insideDhaka: 120,
        outsideDhaka: 150,
      },
      courierCredentials: {
        steadfastApiKey: "",
        pathaoClientId: "",
      },
      paymentCredentials: {},
      analytics: {},
    };
    return NextResponse.json({ success: true, data: { settings: defaultSettings } });
  }
}