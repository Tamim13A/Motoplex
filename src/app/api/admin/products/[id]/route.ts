import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import { Product } from "@/models";
import { requireRole } from "@/lib/auth";
import { invalidateProductsCache } from "@/app/api/products/route";

const updateProductSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  slug: z.string().min(2).max(200).optional(),
  tagline: z.string().min(5).max(300).optional(),
  brand: z.string().min(1).max(100).optional(),
  productType: z.string().optional(),
  category: z.string().optional(),
  categorySlug: z.string().min(1).optional(),
  subcategory: z.string().optional(),
  subcategorySlug: z.string().optional(),
  childCategory: z.string().optional(),
  productGroup: z.string().optional(),
  price: z.number().min(0).optional(),
  compareAtPrice: z.number().min(0).optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
  sku: z.string().min(1).max(50).optional(),
  stock: z.number().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  images: z.array(z.string().min(1)).optional(),
  description: z.string().min(10).optional(),
  features: z.array(z.string()).optional(),
  specifications: z.record(z.string(), z.string()).optional(),
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
  })).optional(),
  colors: z.array(z.object({ name: z.string(), hex: z.string() })).optional(),
  sizes: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
});

const stockAdjustSchema = z.object({
  stock: z.number().min(0),
  variantSku: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    await requireRole("admin", "moderator");

    const { id } = await params;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { $or: [{ slug: id }, { sku: id }] };

    const product = await Product.findOne(query).lean();
    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: { product } });
  } catch (error) {
    if (error instanceof Error && (error.message === "Insufficient permissions" || error.message === "Authentication required")) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.message === "Insufficient permissions" ? 403 : 401 }
      );
    }

    console.error("[API/admin/products/[id]] Error:", error);
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
    await requireRole("admin", "moderator");

    const { id } = await params;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { $or: [{ slug: id }, { sku: id }] };

    const body = await request.json();
    const validatedData = updateProductSchema.parse(body);

    if (validatedData.slug) {
      const existingSlug = await Product.findOne({ slug: validatedData.slug, ...(!mongoose.Types.ObjectId.isValid(id) ? {} : { _id: { $ne: id } }) });
      if (existingSlug && existingSlug._id.toString() !== id && existingSlug.slug !== id) {
        return NextResponse.json(
          { success: false, message: "Product with this slug already exists" },
          { status: 400 }
        );
      }
    }

    if (validatedData.sku) {
      const existingSku = await Product.findOne({ sku: validatedData.sku, ...(!mongoose.Types.ObjectId.isValid(id) ? {} : { _id: { $ne: id } }) });
      if (existingSku && existingSku._id.toString() !== id && existingSku.sku !== id) {
        return NextResponse.json(
          { success: false, message: "Product with this SKU already exists" },
          { status: 400 }
        );
      }
    }

    let updatePayload: Record<string, unknown> = { ...validatedData };
    if (validatedData.specifications) {
      updatePayload.specifications = new Map(Object.entries(validatedData.specifications));
    }

    const product = await Product.findOneAndUpdate(
      query,
      { $set: updatePayload },
      { new: true, runValidators: true }
    );

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    invalidateProductsCache();

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
      data: { product },
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

    console.error("[API/admin/products/[id]] Error:", error);
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
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { $or: [{ slug: id }, { sku: id }] };

    const product = await Product.findOneAndDelete(query);
    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    invalidateProductsCache();

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "Insufficient permissions" || error.message === "Authentication required")) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.message === "Insufficient permissions" ? 403 : 401 }
      );
    }

    console.error("[API/admin/products/[id]] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    await requireRole("admin", "moderator");

    const { id } = await params;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { $or: [{ slug: id }, { sku: id }] };

    const body = await request.json();
    const updatePayload: Record<string, unknown> = {};

    if (body.stock !== undefined) {
      updatePayload.stock = Number(body.stock);
    }
    if (body.images !== undefined && Array.isArray(body.images)) {
      updatePayload.images = body.images;
    }
    if (body.name !== undefined) updatePayload.name = body.name;
    if (body.price !== undefined) updatePayload.price = Number(body.price);
    if (body.compareAtPrice !== undefined) updatePayload.compareAtPrice = Number(body.compareAtPrice);
    if (body.brand !== undefined) updatePayload.brand = body.brand;
    if (body.category !== undefined) updatePayload.category = body.category;
    if (body.categorySlug !== undefined) updatePayload.categorySlug = body.categorySlug;
    if (body.subcategory !== undefined) updatePayload.subcategory = body.subcategory;
    if (body.subcategorySlug !== undefined) updatePayload.subcategorySlug = body.subcategorySlug;
    if (body.isFeatured !== undefined) updatePayload.isFeatured = Boolean(body.isFeatured);
    if (body.isBestSeller !== undefined) updatePayload.isBestSeller = Boolean(body.isBestSeller);
    if (body.isNewArrival !== undefined) updatePayload.isNewArrival = Boolean(body.isNewArrival);
    if (body.tagline !== undefined) updatePayload.tagline = body.tagline;
    if (body.description !== undefined) updatePayload.description = body.description;
    if (body.sku !== undefined) updatePayload.sku = body.sku;
    if (body.colors !== undefined && Array.isArray(body.colors)) updatePayload.colors = body.colors;
    if (body.sizes !== undefined && Array.isArray(body.sizes)) updatePayload.sizes = body.sizes;

    const product = await Product.findOneAndUpdate(
      query,
      { $set: updatePayload },
      { new: true }
    );

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    invalidateProductsCache();

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
      data: { product },
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

    console.error("[API/admin/products/[id]/stock] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}