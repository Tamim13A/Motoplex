import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import { Review, Product, Order } from "@/models";
import { getCurrentUser } from "@/lib/auth";

const createReviewSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  rating: z.number().min(1).max(5),
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  comment: z.string().min(10, "Comment must be at least 10 characters").max(2000),
  images: z.array(z.string()).max(5).optional(),
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createReviewSchema.parse(body);

    const product = await Product.findById(validatedData.productId);
    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    const hasPurchased = await Order.exists({
      userId: user._id,
      "items.productId": product._id,
      paymentStatus: "paid",
      orderStatus: { $in: ["Delivered", "Shipped"] },
    });

    const existingReview = await Review.findOne({
      productId: product._id,
      userId: user._id,
    });

    if (existingReview) {
      return NextResponse.json(
        { success: false, message: "You have already reviewed this product" },
        { status: 400 }
      );
    }

    const review = await Review.create({
      productId: product._id,
      userId: user._id,
      userName: user.name,
      userCity: user.addresses[0]?.district || "",
      rating: validatedData.rating,
      title: validatedData.title,
      comment: validatedData.comment,
      images: validatedData.images || [],
      verifiedPurchase: !!hasPurchased,
      status: "pending",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Review submitted for moderation",
        data: { review },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Validation error", errors: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    console.error("[API/reviews] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}