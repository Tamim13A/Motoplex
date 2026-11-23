import { Product } from "@/types";

export function formatProduct(doc: any): Product {
  const specs =
    doc.specifications instanceof Map
      ? Object.fromEntries(doc.specifications)
      : typeof doc.specifications === "object" && doc.specifications !== null
      ? doc.specifications
      : {};

    const rawColors = Array.isArray(doc.colors) && doc.colors.length > 0
      ? doc.colors
      : (doc.variants || [])
          .filter((v: any) => v.color)
          .map((v: any) => ({ name: v.color, hex: v.colorHex || "#18181b" }));

    const resolvedColors = rawColors.length > 0
      ? rawColors
      : [
          { name: "Matte Black", hex: "#18181b" },
          { name: "Racing Red", hex: "#dc2626" },
          { name: "Gloss White", hex: "#ffffff" },
          { name: "Titanium Silver", hex: "#64748b" },
        ];

    return {
      id: doc._id?.toString() || doc.id || "",
      name: doc.name || "",
      slug: doc.slug || "",
      tagline: doc.tagline || "",
      brand: doc.brand || "",
      productType: doc.productType || "",
      category: doc.category || doc.categorySlug || "",
      categorySlug: doc.categorySlug || "",
      subcategory: doc.subcategory || doc.subcategorySlug || "",
      subcategorySlug: doc.subcategorySlug || "",
      childCategory: doc.childCategory,
      productGroup: doc.productGroup,
      price: Number(doc.price) || 0,
      compareAtPrice: doc.compareAtPrice ? Number(doc.compareAtPrice) : undefined,
      discountPercentage: doc.discountPercentage || (doc.compareAtPrice && doc.compareAtPrice > doc.price ? Math.round(((doc.compareAtPrice - doc.price) / doc.compareAtPrice) * 100) : 0),
      rating: doc.rating || 0,
      reviewCount: doc.reviewCount || 0,
      sku: doc.sku || "",
      stock: Number(doc.stock) || 0,
      images:
        Array.isArray(doc.images) && doc.images.length > 0
          ? doc.images
          : [
              "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=600&auto=format&fit=crop",
            ],
      description: doc.description || "",
      features: Array.isArray(doc.features) ? doc.features : [],
      specifications: specs,
      variants: (doc.variants || []).map((v: any, idx: number) => ({
        id: v._id?.toString() || v.id || `var-${idx}`,
        name: v.name || "",
        size: v.size,
        color: v.color,
        colorHex: v.colorHex,
        material: v.material,
        price: Number(v.price) || Number(doc.price) || 0,
        compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : undefined,
        costPrice: v.costPrice ? Number(v.costPrice) : undefined,
        stock: Number(v.stock) || 0,
        sku: v.sku || `${doc.sku}-${idx}`,
      })),
      sizes: Array.isArray(doc.sizes) && doc.sizes.length > 0 ? doc.sizes : ["Standard"],
      colors: resolvedColors,
      materials: Array.isArray(doc.materials) ? doc.materials : [],
      isFeatured: Boolean(doc.isFeatured),
      isBestSeller: Boolean(doc.isBestSeller),
      isNewArrival: Boolean(doc.isNewArrival),
      isPreOrder: Boolean(doc.isPreOrder),
    };
}

