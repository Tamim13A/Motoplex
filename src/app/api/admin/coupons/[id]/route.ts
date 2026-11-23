import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import { Coupon } from "@/models";
import { requireRole } from "@/lib/auth";

const updateCouponSchema = z.object({
  code: z.string().min(2).max(50).toUpperCase().optional(),
  type: z.enum(["percentage", "flat", "free_shipping"]).optional(),
  value: z.number().min(0).optional(),
  minOrder: z.number().min(0).optional(),
  maxDiscount: z.number().min(0).optional(),
  maxUses: z.number().min(1).optional(),
  expiresAt: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    await requireRole("admin", "moderator");

    const { id } = await params;

    const coupon = await Coupon.findById(id).lean();
    if (!coupon) {
      return NextResponse.json(
        { success: false, message: "Coupon not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: { coupon } });
  } catch (error) {
    if (error instanceof Error && (error.message === "Insufficient permissions" || error.message === "Authentication required")) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.message === "Insufficient permissions" ? 403 : 401 }
      );
    }

    console.error("[API/admin/coupons/[id]] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    await requireRole("admin");

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateCouponSchema.parse(body);

    if (validatedData.code) {
      const existingCode = await Coupon.findOne({ code: validatedData.code, _id: { $ne: id } });
      if (existingCode) {
        return NextResponse.json(
          { success: false, message: "Coupon with this code already exists" },
          { status: 400 }
        );
      }
    }

    if (validatedData.expiresAt) {
      const updateData = { ...validatedData, expiresAt: new Date(validatedData.expiresAt) } as typeof validatedData & { expiresAt: Date };

      const coupon = await Coupon.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!coupon) {
        return NextResponse.json(
          { success: false, message: "Coupon not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Coupon updated successfully",
        data: { coupon },
      });
    } else {
      const coupon = await Coupon.findByIdAndUpdate(
        id,
        { $set: validatedData },
        { new: true, runValidators: true }
      );

      if (!coupon) {
        return NextResponse.json(
          { success: false, message: "Coupon not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Coupon updated successfully",
        data: { coupon },
      });
    }
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

    console.error("[API/admin/coupons/[id]] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    await requireRole("admin");

    const { id } = await params;

    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      return NextResponse.json(
        { success: false, message: "Coupon not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "Insufficient permissions" || error.message === "Authentication required")) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.message === "Insufficient permissions" ? 403 : 401 }
      );
    }

    console.error("[API/admin/coupons/[id]] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}