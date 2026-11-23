import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Category } from "@/models";
import { categories as fallbackCategories } from "@/data/categories";

export async function GET() {
  try {
    await connectDB();

    const categories = await Category.find({}).sort({ featured: -1, name: 1 }).lean();

    if (categories && categories.length > 0) {
      return NextResponse.json(
        {
          success: true,
          data: categories,
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
          },
        }
      );
    }
  } catch {
    // Database offline, serve fast static categories
  }

  return NextResponse.json(
    {
      success: true,
      data: fallbackCategories,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
      },
    }
  );
}
