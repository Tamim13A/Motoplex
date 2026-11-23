import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  addresses: z
    .array(
      z.object({
        division: z.string(),
        district: z.string(),
        area: z.string(),
        address: z.string(),
        isDefault: z.boolean().optional(),
      })
    )
    .optional(),
});

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: (user._id || (user as any).id || "usr-001").toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isVerified: user.isVerified,
          addresses: user.addresses,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("[API/auth/me] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    if (validatedData.name) user.name = validatedData.name.trim();
    if (validatedData.phone !== undefined) user.phone = validatedData.phone.trim();
    if (validatedData.addresses !== undefined) user.addresses = validatedData.addresses as any;

    await user.save();

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: {
          id: (user._id || (user as any).id || "usr-001").toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isVerified: user.isVerified,
          addresses: user.addresses,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Validation error", errors: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    console.error("[API/auth/me PATCH] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}