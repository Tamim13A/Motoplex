import mongoose, { Document, Schema } from "mongoose";

export interface IProductVariant {
  name: string;
  size?: string;
  color?: string;
  colorHex?: string;
  material?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  stock: number;
  sku: string;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  tagline: string;
  brand: string;
  productType?: string;
  category?: string;
  categorySlug: string;
  subcategory?: string;
  subcategorySlug?: string;
  childCategory?: string;
  productGroup?: string;
  price: number;
  compareAtPrice?: number;
  discountPercentage?: number;
  rating: number;
  reviewCount: number;
  sku: string;
  stock: number;
  costPrice?: number;
  images: string[];
  description: string;
  features: string[];
  specifications: Map<string, string>;
  variants: IProductVariant[];
  colors?: { name: string; hex: string }[];
  sizes?: string[];
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productVariantSchema = new Schema<IProductVariant>({
  name: { type: String, required: true, trim: true },
  size: { type: String, trim: true },
  color: { type: String, trim: true },
  colorHex: { type: String, trim: true },
  material: { type: String, trim: true },
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, min: 0 },
  costPrice: { type: Number, min: 0 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  sku: { type: String, required: true, trim: true },
});

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, index: true },
    tagline: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true, index: true },
    productType: { type: String, trim: true },
    category: { type: String, trim: true },
    categorySlug: { type: String, required: true, trim: true, index: true },
    subcategory: { type: String, trim: true },
    subcategorySlug: { type: String, trim: true },
    childCategory: { type: String, trim: true },
    productGroup: { type: String, trim: true },
    price: { type: Number, required: true, min: 0, index: true },
    compareAtPrice: { type: Number, min: 0 },
    discountPercentage: { type: Number, min: 0, max: 100, default: 0 },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    reviewCount: { type: Number, min: 0, default: 0 },
    sku: { type: String, required: true, unique: true, trim: true, index: true },
    stock: { type: Number, required: true, min: 0, default: 0, index: true },
    costPrice: { type: Number, min: 0 },
    images: [{ type: String, required: true }],
    description: { type: String, required: true },
    features: [{ type: String, trim: true }],
    specifications: { type: Map, of: String },
    variants: [productVariantSchema],
    colors: [{ name: { type: String, trim: true }, hex: { type: String, trim: true } }],
    sizes: [{ type: String, trim: true }],
    isFeatured: { type: Boolean, default: false, index: true },
    isBestSeller: { type: Boolean, default: false, index: true },
    isNewArrival: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

productSchema.index({ "variants.sku": 1 }, { unique: true, sparse: true });
productSchema.index({ name: "text", brand: "text", description: "text" });

export const Product = mongoose.models.Product || mongoose.model<IProduct>("Product", productSchema);