import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Review } from "@/models";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();

    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const product = await connectDB().then(() => import("@/models")).then(({ Product }) => 
      Product.findOne({ slug }).select("_id").lean()
    );

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find({ productId: product._id, status: "approved" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments({ productId: product._id, status: "approved" }),
    ]);

    const totalPages = Math.ceil(total / limit);

    const ratingStats = await Review.aggregate([
      { $match: { productId: product._id, status: "approved" } },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
    ]);

    const ratingBreakdown = [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: ratingStats.find((r) => r._id === stars)?.count || 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        ratingBreakdown,
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
    console.error("[API/products/[slug]/reviews] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}