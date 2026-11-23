import connectDB from "@/lib/db";
import { User, Category, Product, Order, Coupon, Review, StoreSetting } from "@/models";
import bcrypt from "bcryptjs";
import { categories } from "@/data/categories";
import { products } from "@/data/products";

async function seedDatabase() {
  try {
    console.log("[Seeder] Connecting to MongoDB...");
    await connectDB();
    console.log("[Seeder] Connected successfully");

    console.log("[Seeder] Clearing existing data...");
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
      Coupon.deleteMany({}),
      Review.deleteMany({}),
      StoreSetting.deleteMany({}),
    ]);
    console.log("[Seeder] Existing data cleared");

    console.log("[Seeder] Creating admin and moderator users...");
    const hashedPassword = await bcrypt.hash("Motoplex@2026!", 12);
    const adminUser = await User.create({
      name: "Admin User",
      email: "admin@motoplex.com",
      phone: "+8801711000000",
      password: hashedPassword,
      role: "admin",
      isVerified: true,
      addresses: [],
    });
    console.log("[Seeder] Admin user created:", adminUser.email);

    const moderatorUser = await User.create({
      name: "Moderator User",
      email: "moderator@motoplex.com",
      phone: "+8801711000001",
      password: hashedPassword,
      role: "moderator",
      isVerified: true,
      addresses: [],
    });
    console.log("[Seeder] Moderator user created:", moderatorUser.email);

    console.log("[Seeder] Seeding categories...");
    const categoryDocs = categories.map((cat) => ({
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: cat.image,
      itemCount: cat.itemCount,
      featured: cat.featured,
      subcategories: cat.subcategories.map((sub) => ({
        name: sub.name,
        slug: sub.slug,
        childCategories: sub.childCategories.map((child) => ({
          name: child.name,
          slug: child.slug,
          productGroups: child.productGroups.map((grp) => ({
            name: grp.name,
            slug: grp.slug,
          })),
        })),
      })),
    }));
    await Category.insertMany(categoryDocs);
    console.log(`[Seeder] ${categoryDocs.length} categories seeded`);

    console.log("[Seeder] Seeding products...");
    const productDocs = products.map((prod) => ({
      name: prod.name,
      slug: prod.slug,
      tagline: prod.tagline,
      brand: prod.brand,
      categorySlug: prod.categorySlug,
      subcategorySlug: prod.subcategorySlug,
      childCategory: prod.childCategory,
      productGroup: prod.productGroup,
      price: prod.price,
      compareAtPrice: prod.compareAtPrice,
      discountPercentage: prod.discountPercentage,
      rating: prod.rating,
      reviewCount: prod.reviewCount,
      sku: prod.sku,
      stock: prod.stock,
      costPrice: Math.floor(prod.price * 0.6),
      images: prod.images,
      description: prod.description,
      features: prod.features,
      specifications: prod.specifications,
      variants: prod.variants.map((v) => ({
        name: v.name,
        size: v.size,
        color: v.color,
        colorHex: v.colorHex,
        material: v.material,
        price: v.price,
        compareAtPrice: v.compareAtPrice,
        costPrice: Math.floor(v.price * 0.6),
        stock: v.stock,
        sku: v.sku,
      })),
      isFeatured: prod.isFeatured,
      isBestSeller: prod.isBestSeller,
      isNewArrival: prod.isNewArrival,
    }));
    await Product.insertMany(productDocs);
    console.log(`[Seeder] ${productDocs.length} products seeded`);

    console.log("[Seeder] Seeding coupons...");
    const couponDocs = [
      {
        code: "WELCOME10",
        type: "percentage",
        value: 10,
        minOrder: 1000,
        maxDiscount: 5000,
        maxUses: 1000,
        usedCount: 0,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
      {
        code: "FREESHIP",
        type: "free_shipping",
        value: 0,
        minOrder: 5000,
        maxUses: 500,
        usedCount: 0,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
      {
        code: "FLAT500",
        type: "flat",
        value: 500,
        minOrder: 2000,
        maxUses: 200,
        usedCount: 0,
        expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    ];
    await Coupon.insertMany(couponDocs);
    console.log(`[Seeder] ${couponDocs.length} coupons seeded`);

    console.log("[Seeder] Seeding store settings...");
    await StoreSetting.create({
      storeName: "MOTOPLEX BD",
      logoUrl: "/logo.svg",
      phone: "+880 1711-000000",
      email: "info@motoplexbd.com",
      address: "Mirpur 60 Feet (Opposite of Paka Masjid), Dhaka, Bangladesh",
      deliveryCharges: { insideDhaka: 120, outsideDhaka: 150 },
    });
    console.log("[Seeder] Store settings created");

    console.log("[Seeder] Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("[Seeder] Error:", error);
    process.exit(1);
  }
}

seedDatabase();