import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import { Category } from "@/models";
import { requireRole } from "@/lib/auth";

const categorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100),
  description: z.string().min(10),
  image: z.string().url(),
  itemCount: z.number().min(0).default(0),
  featured: z.boolean().default(false),
  subcategories: z.array(z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    childCategories: z.array(z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
      productGroups: z.array(z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
      })).default([]),
    })).default([]),
  })).default([]),
});

export async function GET() {
  try {
    await connectDB();
    await requireRole("admin", "moderator");

    const categories = await Category.find({}).sort({ featured: -1, name: 1 }).lean();

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    if (error instanceof Error && (error.message === "Insufficient permissions" || error.message === "Authentication required")) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.message === "Insufficient permissions" ? 403 : 401 }
      );
    }

    console.warn("[API/admin/categories] Database offline or error, serving fallback categories.");
    const { categories: fallbackCategories } = await import("@/data/categories");
    return NextResponse.json({ success: true, data: fallbackCategories });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    await requireRole("admin");

    const body = await request.json();
    const validatedData = categorySchema.parse(body);

    const existingSlug = await Category.findOne({ slug: validatedData.slug });
    if (existingSlug) {
      return NextResponse.json(
        { success: false, message: "Category with this slug already exists" },
        { status: 400 }
      );
    }

    const category = await Category.create(validatedData);

    return NextResponse.json(
      {
        success: true,
        message: "Category created successfully",
        data: { category },
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

    console.warn("[API/admin/categories] Database offline or error, serving fallback categories.");
    const { categories: fallbackCategories } = await import("@/data/categories");
    return NextResponse.json({ success: true, data: fallbackCategories });
  }
}