import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { ServiceBooking } from "@/models/ServiceBooking";
import { requireRole } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    await requireRole("admin", "moderator");
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const query: any = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { bookingNumber: searchRegex },
        { customerName: searchRegex },
        { customerPhone: searchRegex },
        { bikeModel: searchRegex },
        { serviceName: searchRegex },
      ];
    }

    const bookings = await ServiceBooking.find(query).sort({ createdAt: -1 }).limit(100);
    const totalCount = await ServiceBooking.countDocuments();
    const pendingCount = await ServiceBooking.countDocuments({ status: "pending" });
    const confirmedCount = await ServiceBooking.countDocuments({ status: "confirmed" });

    return NextResponse.json({
      success: true,
      bookings,
      counts: {
        total: totalCount,
        pending: pendingCount,
        confirmed: confirmedCount,
      },
    });
  } catch (error: any) {
    if (error instanceof Error && (error.message === "Insufficient permissions" || error.message === "Authentication required")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.message === "Insufficient permissions" ? 403 : 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    await requireRole("admin", "moderator");
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: "Booking ID and new status are required" },
        { status: 400 }
      );
    }

    const validStatuses = ["pending", "confirmed", "in_progress", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid booking status" },
        { status: 400 }
      );
    }

    const updated = await ServiceBooking.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, booking: updated });
  } catch (error: any) {
    if (error instanceof Error && (error.message === "Insufficient permissions" || error.message === "Authentication required")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.message === "Insufficient permissions" ? 403 : 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update booking" },
      { status: 500 }
    );
  }
}

