import mongoose, { Document, Schema } from "mongoose";

export interface ICoupon extends Document {
  code: string;
  type: "percentage" | "flat" | "free_shipping";
  value: number;
  minOrder: number;
  maxDiscount?: number;
  maxUses: number;
  usedCount: number;
  expiresAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    type: { type: String, enum: ["percentage", "flat", "free_shipping"], required: true },
    value: { type: Number, required: true, min: 0 },
    minOrder: { type: Number, required: true, min: 0, default: 0 },
    maxDiscount: { type: Number, min: 0 },
    maxUses: { type: Number, required: true, min: 1, default: 1 },
    usedCount: { type: Number, min: 0, default: 0 },
    expiresAt: { type: Date, required: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const Coupon = mongoose.models.Coupon || mongoose.model<ICoupon>("Coupon", couponSchema);