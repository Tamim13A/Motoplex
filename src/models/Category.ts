import mongoose, { Document, Schema } from "mongoose";

export interface IProductGroup {
  name: string;
  slug: string;
}

export interface IChildCategory {
  name: string;
  slug: string;
  productGroups: IProductGroup[];
}

export interface ISubCategory {
  name: string;
  slug: string;
  childCategories: IChildCategory[];
}

export interface ICategory extends Document {
  name: string;
  slug: string;
  description: string;
  image: string;
  itemCount: number;
  featured: boolean;
  subcategories: ISubCategory[];
  createdAt: Date;
  updatedAt: Date;
}

const productGroupSchema = new Schema<IProductGroup>({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true },
});

const childCategorySchema = new Schema<IChildCategory>({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true },
  productGroups: [productGroupSchema],
});

const subCategorySchema = new Schema<ISubCategory>({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true },
  childCategories: [childCategorySchema],
});

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, index: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    itemCount: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    subcategories: [subCategorySchema],
  },
  { timestamps: true }
);

categorySchema.index({ featured: 1 });

export const Category = mongoose.models.Category || mongoose.model<ICategory>("Category", categorySchema);