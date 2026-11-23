import React from "react";
import { notFound } from "next/navigation";
import { products as staticProducts } from "@/data/products";
import { ProductDetailView } from "./ProductDetailView";
import connectDB from "@/lib/db";
import { Product as ProductModel } from "@/models";
import { formatProduct } from "@/lib/productFormatter";
import { Product } from "@/types";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  let product: Product | null = null;
  let relatedProducts: Product[] = [];

  try {
    await connectDB();
    const dbProduct = await ProductModel.findOne({ slug }).lean();
    if (dbProduct) {
      product = formatProduct(dbProduct);
      const dbRelated = await ProductModel.find({
        categorySlug: dbProduct.categorySlug,
        slug: { $ne: dbProduct.slug },
      })
        .limit(4)
        .lean();
      if (dbRelated.length > 0) {
        relatedProducts = dbRelated.map(formatProduct);
      }
    }
  } catch (err) {
    console.warn("[ProductPage] Database fetch failed, falling back to static catalog:", err);
  }

  // Fallback to static catalog if not found in database
  if (!product) {
    const staticProd = staticProducts.find((p) => p.slug === slug);
    if (staticProd) {
      product = staticProd;
    }
  }

  if (!product) {
    notFound();
  }

  if (relatedProducts.length === 0) {
    relatedProducts = staticProducts
      .filter((p) => p.id !== product!.id && p.categorySlug === product!.categorySlug)
      .slice(0, 4);
  }

  return <ProductDetailView product={product} relatedProducts={relatedProducts} />;
}
