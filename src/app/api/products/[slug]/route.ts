import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Product } from "@/models";
import { products as fallbackCatalog } from "@/data/products";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    await connectDB();

    const product = await Product.findOne({ slug }).lean();

    if (product) {
      const relatedProducts = await Product.find({
        _id: { $ne: product._id },
        categorySlug: product.categorySlug,
      })
        .limit(8)
        .select(
          "name slug tagline brand price compareAtPrice discountPercentage rating reviewCount images isFeatured isBestSeller isNewArrival"
        )
        .lean();

      return NextResponse.json(
        {
          success: true,
          data: {
            product,
            relatedProducts,
          },
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
          },
        }
      );
    }
  } catch {
    // Database offline, serve fast static catalog
  }

  const staticProduct = fallbackCatalog.find(
    (p) => p.slug === slug || p.id === slug
  );

  if (!staticProduct) {
    return NextResponse.json(
      { success: false, message: "Product not found" },
      { status: 404 }
    );
  }

  const related = fallbackCatalog
    .filter(
      (p) =>
        p.categorySlug === staticProduct.categorySlug && p.id !== staticProduct.id
    )
    .slice(0, 8);

  return NextResponse.json({
    success: true,
    data: {
      product: staticProduct,
      relatedProducts: related,
    },
  });
}
