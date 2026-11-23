import mongoose, { Document, Schema } from "mongoose";

export interface IDeliveryCharges {
  insideDhaka: number;
  outsideDhaka: number;
}

export interface ICourierCredentials {
  steadfastApiKey?: string;
  steadfastSecret?: string;
  pathaoClientId?: string;
  pathaoClientSecret?: string;
}

export interface IPaymentCredentials {
  bkashAppKey?: string;
  bkashAppSecret?: string;
  aamarPayStoreId?: string;
  aamarPaySignatureKey?: string;
}

export interface IAnalytics {
  fbPixelId?: string;
  gtmId?: string;
}

export interface IStoreSetting extends Document {
  storeName: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
  address?: string;
  deliveryCharges: IDeliveryCharges;
  courierCredentials: ICourierCredentials;
  paymentCredentials: IPaymentCredentials;
  analytics: IAnalytics;
  updatedAt: Date;
}

const deliveryChargesSchema = new Schema<IDeliveryCharges>({
  insideDhaka: { type: Number, default: 120 },
  outsideDhaka: { type: Number, default: 150 },
});

const courierCredentialsSchema = new Schema<ICourierCredentials>({
  steadfastApiKey: { type: String },
  steadfastSecret: { type: String },
  pathaoClientId: { type: String },
  pathaoClientSecret: { type: String },
});

const paymentCredentialsSchema = new Schema<IPaymentCredentials>({
  bkashAppKey: { type: String },
  bkashAppSecret: { type: String },
  aamarPayStoreId: { type: String },
  aamarPaySignatureKey: { type: String },
});

const analyticsSchema = new Schema<IAnalytics>({
  fbPixelId: { type: String },
  gtmId: { type: String },
});

const storeSettingSchema = new Schema<IStoreSetting>(
  {
    storeName: { type: String, required: true, default: "MOTOPLEX BD" },
    logoUrl: { type: String },
    phone: { type: String },
    email: { type: String },
    address: { type: String },
    deliveryCharges: { type: deliveryChargesSchema, default: () => ({}) },
    courierCredentials: { type: courierCredentialsSchema, default: () => ({}) },
    paymentCredentials: { type: paymentCredentialsSchema, default: () => ({}) },
    analytics: { type: analyticsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

storeSettingSchema.index({}, { unique: true });

export const StoreSetting = mongoose.models.StoreSetting || mongoose.model<IStoreSetting>("StoreSetting", storeSettingSchema);

export async function getStoreSettings(): Promise<IStoreSetting> {
  let settings = await StoreSetting.findOne();
  if (!settings) {
    settings = await StoreSetting.create({});
  }
  return settings;
}