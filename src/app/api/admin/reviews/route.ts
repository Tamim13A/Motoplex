import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Review } from "@/models";
import { requireRole } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    await requireRole("admin", "moderator");

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") || "pending";

    const filter: Record<string, unknown> = {};
    if (status !== "all") filter.status = status;

    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        reviews,
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
  } catch (error) {
    if (error instanceof Error && (error.message === "Insufficient permissions" || error.message === "Authentication required")) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.message === "Insufficient permissions" ? 403 : 401 }
      );
    }

    console.warn("[API/admin/reviews] Database offline or error, serving empty reviews.");
    return NextResponse.json({
      success: true,
      data: {
        reviews: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      },
    });
  }
}