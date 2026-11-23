import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import { User } from "@/models";
import { requireRole } from "@/lib/auth";
import { getStoredUsers, updateStoredUserRole } from "@/lib/userStore";

export async function GET(request: NextRequest) {
  try {
    await requireRole("admin");
  } catch (error) {
    if (error instanceof Error && (error.message === "Insufficient permissions" || error.message === "Authentication required")) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.message === "Insufficient permissions" ? 403 : 401 }
      );
    }
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const role = searchParams.get("role") || "all";

  try {
    await connectDB();

    const filter: Record<string, unknown> = {};
    if (role !== "all") filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .select("-password -otpCode -otpExpiresAt")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    if (users && users.length > 0) {
      return NextResponse.json({
        success: true,
        data: { users },
      });
    }
  } catch {
    // Database offline or error, proceed to persistent userStore
  }

  // Resilient fallback to userStore
  let stored = getStoredUsers();
  if (role !== "all") {
    stored = stored.filter((u) => u.role === role);
  }
  if (search) {
    const q = search.toLowerCase();
    stored = stored.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q))
    );
  }

  const sanitized = stored.map((u) => ({
    _id: u.id || u._id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    isVerified: u.isVerified,
    createdAt: u.createdAt,
  }));

  return NextResponse.json({ success: true, data: { users: sanitized } });
}

const updateRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(["user", "moderator", "admin"]),
});

export async function PATCH(request: NextRequest) {
  try {
    await requireRole("admin");
  } catch (error) {
    if (error instanceof Error && (error.message === "Insufficient permissions" || error.message === "Authentication required")) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.message === "Insufficient permissions" ? 403 : 401 }
      );
    }
  }

  try {
    const body = await request.json();
    const validatedData = updateRoleSchema.parse(body);

    // Try MongoDB
    try {
      await connectDB();

      const user = await User.findByIdAndUpdate(
        validatedData.userId,
        { role: validatedData.role },
        { new: true }
      ).select("-password -otpCode -otpExpiresAt");

      if (user) {
        updateStoredUserRole(validatedData.userId, validatedData.role);
        return NextResponse.json({
          success: true,
          message: `User role updated to ${validatedData.role}`,
          data: { user },
        });
      }
    } catch {
      // Offline fallback
    }

    const updated = updateStoredUserRole(validatedData.userId, validatedData.role);
    if (updated) {
      return NextResponse.json({
        success: true,
        message: `User role updated to ${validatedData.role}`,
        data: { user: updated },
      });
    }

    return NextResponse.json(
      { success: false, message: "User not found" },
      { status: 404 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Validation error", errors: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    console.error("[API/admin/users PATCH] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
