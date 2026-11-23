import mongoose, { Document, Schema, Types } from "mongoose";

export interface IOrderItem {
  productId: Types.ObjectId;
  variantId?: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  image: string;
  variantDetails?: {
    size?: string;
    color?: string;
    material?: string;
  };
}

export interface IShippingAddress {
  fullName: string;
  phone: string;
  division: string;
  district: string;
  area: string;
  address: string;
}

export interface ICourierInfo {
  name?: "Steadfast" | "Pathao" | "RedX";
  trackingNumber?: string;
  consignmentId?: string;
  status?: string;
}

export interface IPaymentDetails {
  advancePaymentMethod?: string;
  advanceAmount?: number;
  senderNumber?: string;
  trxId?: string;
  bankName?: string;
  accountNumber?: string;
  reference?: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  userId?: Types.ObjectId;
  customerInfo: {
    fullName: string;
    email: string;
    phone: string;
  };
  shippingAddress: IShippingAddress;
  items: IOrderItem[];
  subtotal: number;
  shippingFee: number;
  advancePaid: number;
  dueAmount: number;
  discount: number;
  total: number;
  couponCode?: string;
  deliveryMethod: string;
  paymentMethod: string;
  paymentStatus: "unpaid" | "paid" | "refunded";
  orderStatus: "Pending" | "Confirmed" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  paymentDetails?: IPaymentDetails;
  courierInfo: ICourierInfo;
  stockDeducted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
  productId: { type: Schema.Types.Mixed, required: true },
  variantId: { type: String },
  name: { type: String, required: true },
  sku: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String, required: true },
  variantDetails: {
    size: { type: String },
    color: { type: String },
    material: { type: String },
  },
});

const shippingAddressSchema = new Schema<IShippingAddress>({
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  division: { type: String, required: true, trim: true },
  district: { type: String, required: true, trim: true },
  area: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
});

const courierInfoSchema = new Schema<ICourierInfo>({
  name: { type: String, enum: ["Steadfast", "Pathao", "RedX"] },
  trackingNumber: { type: String },
  consignmentId: { type: String },
  status: { type: String },
});

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.Mixed, ref: "User", index: true },
    customerInfo: {
      fullName: { type: String, required: true, trim: true },
      email: { type: String, default: "customer@motoplexbd.com", trim: true, lowercase: true },
      phone: { type: String, required: true, trim: true },
    },
    shippingAddress: { type: shippingAddressSchema, required: true },
    items: { type: [orderItemSchema], required: true, validate: (v: IOrderItem[]) => v.length > 0 },
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, required: true, min: 0, default: 0 },
    advancePaid: { type: Number, min: 0, default: 0 },
    dueAmount: { type: Number, min: 0, default: 0 },
    discount: { type: Number, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    couponCode: { type: String, trim: true, uppercase: true },
    deliveryMethod: {
      type: String,
      default: "Pathao Express",
      required: true,
    },
    paymentMethod: {
      type: String,
      default: "Advance Delivery Fee + COD",
      required: true,
    },
    paymentDetails: {
      advancePaymentMethod: { type: String },
      advanceAmount: { type: Number },
      senderNumber: { type: String },
      trxId: { type: String },
      bankName: { type: String },
      accountNumber: { type: String },
      reference: { type: String },
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
      index: true,
    },
    orderStatus: {
      type: String,
      enum: ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
      index: true,
    },
    courierInfo: { type: courierInfoSchema, default: {} },
    stockDeducted: { type: Boolean, default: true },
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ "customerInfo.phone": 1 });

export const Order = mongoose.models.Order || mongoose.model<IOrder>("Order", orderSchema);