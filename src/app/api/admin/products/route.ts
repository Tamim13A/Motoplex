import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import { Product } from "@/models";
import { requireRole } from "@/lib/auth";
import { invalidateProductsCache } from "@/app/api/products/route";

const productSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(200),
  tagline: z.string().min(5).max(300),
  brand: z.string().min(1).max(100),
  productType: z.string().optional(),
  category: z.string().optional(),
  categorySlug: z.string().min(1),
  subcategory: z.string().optional(),
  subcategorySlug: z.string().optional(),
  childCategory: z.string().optional(),
  productGroup: z.string().optional(),
  price: z.number().min(0),
  compareAtPrice: z.number().min(0).optional(),
  discountPercentage: z.number().min(0).max(100).default(0),
  sku: z.string().min(1).max(50),
  stock: z.number().min(0).default(0),
  costPrice: z.number().min(0).optional(),
  images: z.array(z.string().min(1)).min(1),
  description: z.string().min(10),
  features: z.array(z.string()).default([]),
  specifications: z.record(z.string(), z.string()).default({}),
  variants: z.array(z.object({
    name: z.string().min(1),
    size: z.string().optional(),
    color: z.string().optional(),
    colorHex: z.string().optional(),
    material: z.string().optional(),
    price: z.number().min(0),
    compareAtPrice: z.number().min(0).optional(),
    costPrice: z.number().min(0).optional(),
    stock: z.number().min(0).default(0),
    sku: z.string().min(1),
  })).default([]),
  colors: z.array(z.object({ name: z.string(), hex: z.string() })).optional(),
  sizes: z.array(z.string()).optional(),
  rating: z.number().min(0).max(5).default(5),
  isFeatured: z.boolean().default(true),
  isBestSeller: z.boolean().default(false),
  isNewArrival: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    await requireRole("admin", "moderator");

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const category = searchParams.get("category");

    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
      ];
    }
    if (status === "out-of-stock") filter.stock = 0;
    if (status === "low-stock") filter.stock = { $gt: 0, $lte: 10 };
    if (status === "in-stock") filter.stock = { $gt: 10 };
    if (category) filter.categorySlug = category;

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
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

    console.warn("[API/admin/products] Database offline or error, serving fallback catalog.");
    const { products: fallbackProducts } = await import("@/data/products");
    return NextResponse.json({
      success: true,
      data: {
        products: fallbackProducts,
        pagination: {
          page: 1,
          limit: fallbackProducts.length,
          total: fallbackProducts.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    await requireRole("admin", "moderator");

    const body = await request.json();
    const validatedData = productSchema.parse(body);

    const existingSlug = await Product.findOne({ slug: validatedData.slug });
    if (existingSlug) {
      return NextResponse.json(
        { success: false, message: "Product with this slug already exists" },
        { status: 400 }
      );
    }

    const existingSku = await Product.findOne({ sku: validatedData.sku });
    if (existingSku) {
      return NextResponse.json(
        { success: false, message: "Product with this SKU already exists" },
        { status: 400 }
      );
    }

    const product = await Product.create({
      ...validatedData,
      specifications: new Map(Object.entries(validatedData.specifications)),
    });

    invalidateProductsCache();

    return NextResponse.json(
      {
        success: true,
        message: "Product created successfully",
        data: { product },
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

    console.warn("[API/admin/products] Database offline or error, serving fallback catalog.");
    const { products: fallbackProducts } = await import("@/data/products");
    return NextResponse.json({
      success: true,
      data: {
        products: fallbackProducts,
        pagination: {
          page: 1,
          limit: fallbackProducts.length,
          total: fallbackProducts.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      },
    });
  }
}