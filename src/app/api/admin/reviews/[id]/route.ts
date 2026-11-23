import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import { Review, Product } from "@/models";
import { requireRole } from "@/lib/auth";
import { invalidateProductsCache } from "@/app/api/products/route";

const updateReviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    await requireRole("admin", "moderator");

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateReviewSchema.parse(body);

    const review = await Review.findById(id);
    if (!review) {
      return NextResponse.json(
        { success: false, message: "Review not found" },
        { status: 404 }
      );
    }

    review.status = validatedData.status;
    await review.save();

    if (validatedData.status === "approved") {
      const productReviews = await Review.find({
        productId: review.productId,
        status: "approved",
      });

      const avgRating =
        productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
      const reviewCount = productReviews.length;

      await Product.findByIdAndUpdate(review.productId, {
        rating: Math.round(avgRating * 10) / 10,
        reviewCount,
      });
      invalidateProductsCache();
    }

    return NextResponse.json({
      success: true,
      message: `Review ${validatedData.status} successfully`,
      data: { review },
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

    console.error("[API/admin/reviews/[id]] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}