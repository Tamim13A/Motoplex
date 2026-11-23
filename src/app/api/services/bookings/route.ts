import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { ServiceBooking } from "@/models/ServiceBooking";
import { sendTelegramServiceBookingNotification } from "@/lib/telegram";
import { getCurrentUser } from "@/lib/auth";

function generateBookingNumber(): string {
  const random = Math.floor(10000 + Math.random() * 90000);
  return `MPX-SRV-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.customerName?.trim() || !body.customerPhone?.trim() || !body.bikeModel?.trim()) {
      return NextResponse.json(
        { success: false, error: "Customer name, phone number, and bike model are required." },
        { status: 400 }
      );
    }

    let user = null;
    try {
      user = await getCurrentUser();
    } catch {
      // Sessionless / guest booking
    }

    await connectDB();

    let bookingNumber = generateBookingNumber();
    // Ensure uniqueness
    let existing = await ServiceBooking.findOne({ bookingNumber });
    let attempts = 0;
    while (existing && attempts < 5) {
      bookingNumber = generateBookingNumber();
      existing = await ServiceBooking.findOne({ bookingNumber });
      attempts++;
    }

    const booking = await ServiceBooking.create({
      bookingNumber,
      userId: user?._id || body.userId || undefined,
      customerEmail: user?.email?.toLowerCase() || body.customerEmail?.toLowerCase() || undefined,
      serviceId: body.serviceId || "srv-master",
      serviceName: body.serviceName || "Official Workshop Service",
      servicePrice: Number(body.servicePrice) || 0,
      serviceDuration: body.serviceDuration || "2 - 4 Hours",
      customerName: body.customerName.trim(),
      customerPhone: body.customerPhone.trim(),
      bikeBrand: body.bikeBrand?.trim() || "Aprilia",
      bikeModel: body.bikeModel?.trim() || "RS 457",
      bikePlate: body.bikePlate?.trim() || "",
      dealershipId: body.dealershipId || "dealership-gulshan",
      dealershipName: body.dealershipName || "Motoplex Gulshan HQ",
      dealershipCity: body.dealershipCity || "Dhaka",
      bookingDate: body.bookingDate || new Date().toISOString().split("T")[0],
      bookingSlot: body.bookingSlot || "11:00 AM – 01:00 PM",
      specialNotes: body.specialNotes?.trim() || "",
      image: body.image || "",
      status: "pending",
    });

    // Instant dispatch to Motoplex BD Admin Telegram Group
    try {
      await sendTelegramServiceBookingNotification({
        bookingNumber: booking.bookingNumber,
        serviceId: booking.serviceId,
        serviceName: booking.serviceName,
        servicePrice: booking.servicePrice,
        serviceDuration: booking.serviceDuration,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        bikeBrand: booking.bikeBrand,
        bikeModel: booking.bikeModel,
        bikePlate: booking.bikePlate,
        dealershipName: booking.dealershipName,
        dealershipCity: booking.dealershipCity,
        bookingDate: booking.bookingDate,
        bookingSlot: booking.bookingSlot,
        specialNotes: booking.specialNotes,
        image: booking.image,
        createdAt: booking.createdAt,
      });
    } catch (tgError) {
      console.warn("[Service Booking] Telegram notification dispatch failed:", tgError);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Service slot successfully reserved and admin notified.",
        booking,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[Service Booking Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to reserve service booking" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");
    const email = searchParams.get("email");
    const userId = searchParams.get("userId");
    const bookingNumber = searchParams.get("bookingNumber");

    const query: any = {};
    if (phone) query.customerPhone = phone;
    if (email) query.customerEmail = email.toLowerCase();
    if (userId) query.userId = userId;
    if (bookingNumber) query.bookingNumber = bookingNumber;

    const bookings = await ServiceBooking.find(query).sort({ createdAt: -1 }).limit(50);

    return NextResponse.json({ success: true, bookings });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve bookings" },
      { status: 500 }
    );
  }
}

