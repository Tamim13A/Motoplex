import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import { Coupon } from "@/models";
import { requireRole } from "@/lib/auth";

const couponSchema = z.object({
  code: z.string().min(2).max(50).toUpperCase(),
  type: z.enum(["percentage", "flat", "free_shipping"]),
  value: z.number().min(0),
  minOrder: z.number().min(0).default(0),
  maxDiscount: z.number().min(0).optional(),
  maxUses: z.number().min(1).default(1),
  expiresAt: z.string().datetime(),
  isActive: z.boolean().default(true),
});

export async function GET() {
  try {
    await connectDB();
    await requireRole("admin", "moderator");

    const coupons = await Coupon.find({}).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ success: true, data: coupons });
  } catch (error) {
    if (error instanceof Error && (error.message === "Insufficient permissions" || error.message === "Authentication required")) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.message === "Insufficient permissions" ? 403 : 401 }
      );
    }

    console.error("[API/admin/coupons] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    await requireRole("admin");

    const body = await request.json();
    const validatedData = couponSchema.parse(body);

    const existingCode = await Coupon.findOne({ code: validatedData.code });
    if (existingCode) {
      return NextResponse.json(
        { success: false, message: "Coupon with this code already exists" },
        { status: 400 }
      );
    }

    const coupon = await Coupon.create({
      ...validatedData,
      expiresAt: new Date(validatedData.expiresAt),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Coupon created successfully",
        data: { coupon },
      },
      { status: 201 }
    );
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

    console.error("[API/admin/coupons] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}