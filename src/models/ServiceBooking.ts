import mongoose, { Document, Schema } from "mongoose";

export interface IServiceBooking extends Document {
  bookingNumber: string;
  userId?: mongoose.Types.ObjectId | string;
  customerEmail?: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration?: string;
  customerName: string;
  customerPhone: string;
  bikeBrand: string;
  bikeModel: string;
  bikePlate?: string;
  dealershipId: string;
  dealershipName: string;
  dealershipCity: string;
  bookingDate: string;
  bookingSlot: string;
  specialNotes?: string;
  image?: string;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

const serviceBookingSchema = new Schema<IServiceBooking>(
  {
    bookingNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    customerEmail: { type: String, trim: true, lowercase: true, index: true },
    serviceId: { type: String, required: true },
    serviceName: { type: String, required: true },
    servicePrice: { type: Number, required: true },
    serviceDuration: { type: String },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true, index: true },
    bikeBrand: { type: String, required: true },
    bikeModel: { type: String, required: true },
    bikePlate: { type: String },
    dealershipId: { type: String, required: true },
    dealershipName: { type: String, required: true },
    dealershipCity: { type: String, required: true },
    bookingDate: { type: String, required: true },
    bookingSlot: { type: String, required: true },
    specialNotes: { type: String },
    image: { type: String },
    status: {
      type: String,
      enum: ["pending", "confirmed", "in_progress", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

export const ServiceBooking =
  mongoose.models.ServiceBooking ||
  mongoose.model<IServiceBooking>("ServiceBooking", serviceBookingSchema);

