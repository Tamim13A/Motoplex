import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import { Product } from "@/models";

const productQuerySchema = z.object({
  category: z.string().optional(),
  subcategory: z.string().optional(),
  childCategory: z.string().optional(),
  productGroup: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  brands: z.string().optional(),
  sizes: z.string().optional(),
  colors: z.string().optional(),
  materials: z.string().optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
  inStockOnly: z.coerce.boolean().optional(),
  q: z.string().optional(),
  sortBy: z.enum(["price-asc", "price-desc", "rating", "newest", "featured"]).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(1000).default(50),
  featured: z.coerce.boolean().optional(),
  bestSeller: z.coerce.boolean().optional(),
  newArrival: z.coerce.boolean().optional(),
});

// In-Memory Hot Cache with Instant Admin Invalidation
interface ProductCacheItem {
  data: unknown;
  expiry: number;
}
const productsMemoryCache = new Map<string, ProductCacheItem>();
const CACHE_TTL_MS = 60 * 1000;

export function invalidateProductsCache() {
  productsMemoryCache.clear();
}

export async function GET(request: NextRequest) {
  const cacheKey = request.nextUrl.search || "default";
  const cached = productsMemoryCache.get(cacheKey);
  if (cached && Date.now() < cached.expiry) {
    return NextResponse.json(cached.data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600",
        "X-Cache": "HIT-FAST",
      },
    });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const validatedQuery = productQuerySchema.parse(Object.fromEntries(searchParams));

    const {
      category,
      subcategory,
      childCategory,
      productGroup,
      minPrice,
      maxPrice,
      brands,
      sizes,
      colors,
      materials,
      rating,
      inStockOnly,
      q,
      sortBy,
      page,
      limit,
      featured,
      bestSeller,
      newArrival,
    } = validatedQuery;

    const filter: Record<string, unknown> = {};
    const andClauses: Record<string, unknown>[] = [];

    if (category) {
      andClauses.push({
        $or: [
          { categorySlug: category },
          { category: category },
          { subcategorySlug: category },
          { subcategory: category },
        ],
      });
    }
    if (subcategory) {
      andClauses.push({
        $or: [
          { subcategorySlug: subcategory },
          { subcategory: subcategory },
        ],
      });
    }
    if (childCategory) filter.childCategory = childCategory;
    if (productGroup) filter.productGroup = productGroup;

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) (filter.price as Record<string, number>).$gte = minPrice;
      if (maxPrice !== undefined) (filter.price as Record<string, number>).$lte = maxPrice;
    }

    if (inStockOnly) filter.stock = { $gt: 0 };

    if (featured) filter.isFeatured = true;
    if (bestSeller) filter.isBestSeller = true;
    if (newArrival) filter.isNewArrival = true;

    if (q) {
      andClauses.push({
        $or: [
          { name: { $regex: q, $options: "i" } },
          { brand: { $regex: q, $options: "i" } },
          { sku: { $regex: q, $options: "i" } },
          { tagline: { $regex: q, $options: "i" } },
        ],
      });
    }

    if (andClauses.length > 0) {
      filter.$and = andClauses;
    }

    const brandArray = brands?.split(",").map((b) => b.trim()).filter(Boolean) ?? [];
    if (brandArray.length > 0) {
      filter.brand = { $regex: brandArray.join("|"), $options: "i" };
    }

    const sizeArray = sizes?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
    const colorArray = colors?.split(",").map((c) => c.trim()).filter(Boolean) ?? [];
    const materialArray = materials?.split(",").map((m) => m.trim()).filter(Boolean) ?? [];

    if (sizeArray.length > 0) {
      filter["variants.size"] = { $in: sizeArray };
    }
    if (colorArray.length > 0) {
      filter["variants.color"] = { $in: colorArray };
    }
    if (materialArray.length > 0) {
      filter["variants.material"] = { $in: materialArray };
    }
    if (rating !== undefined) {
      filter.rating = { $gte: rating };
    }

    let sort: Record<string, 1 | -1> = { createdAt: -1 };
    switch (sortBy) {
      case "price-asc":
        sort = { price: 1 };
        break;
      case "price-desc":
        sort = { price: -1 };
        break;
      case "rating":
        sort = { rating: -1, reviewCount: -1 };
        break;
      case "newest":
        sort = { createdAt: -1 };
        break;
      case "featured":
        sort = { isFeatured: -1, createdAt: -1 };
        break;
    }

    const skip = (page - 1) * limit;

    const isFull = searchParams.get("full") === "true";
    const productQuery = Product.find(filter);
    if (!isFull) {
      productQuery.select(
        "name slug tagline brand category categorySlug subcategory subcategorySlug price compareAtPrice discountPercentage rating reviewCount stock images isFeatured isBestSeller isNewArrival"
      );
    }

    const [products, total] = await Promise.all([
      productQuery
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    const responsePayload = {
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    };

    productsMemoryCache.set(cacheKey, {
      data: responsePayload,
      expiry: Date.now() + CACHE_TTL_MS,
    });

    return NextResponse.json(responsePayload, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600",
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Validation error", errors: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    console.warn("[API/products] Database offline, serving resilient catalog fallback.");
    const { products: fallbackProducts } = await import("@/data/products");
    let result = [...fallbackProducts];

    const { searchParams } = new URL(request.url);
    const brandsParam = searchParams.get("brands");
    if (brandsParam) {
      const bList = brandsParam.split(",").map((b) => b.trim().toLowerCase()).filter(Boolean);
      if (bList.length > 0) {
        result = result.filter((p) => bList.some((b) => p.brand.toLowerCase().includes(b)));
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        products: result.slice(0, 20),
        pagination: {
          page: 1,
          limit: 20,
          total: result.length,
          totalPages: Math.ceil(result.length / 20) || 1,
          hasNext: false,
          hasPrev: false,
        },
      },
    });
  }
}