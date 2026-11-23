import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import { User } from "@/models";
import { hashPassword, generateToken, setAuthCookie, generateOTP, getOTPExpiry } from "@/lib/auth";
import { findStoredUser, createStoredUser } from "@/lib/userStore";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^(\+?8801|01)[3-9]\d{8}$/, "Invalid Bangladesh phone number").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    const emailClean = validatedData.email.toLowerCase().trim();
    const phoneClean = validatedData.phone?.trim();

    // 1. Try MongoDB if online
    try {
      await connectDB();

      const existingUser = await User.findOne({ email: emailClean });
      if (existingUser) {
        return NextResponse.json(
          { success: false, message: "Email already registered" },
          { status: 400 }
        );
      }

      if (phoneClean) {
        const existingPhone = await User.findOne({ phone: phoneClean });
        if (existingPhone) {
          return NextResponse.json(
            { success: false, message: "Phone number already registered" },
            { status: 400 }
          );
        }
      }

      const hashedPassword = await hashPassword(validatedData.password);
      const otpCode = generateOTP();
      const otpExpiresAt = getOTPExpiry(10);

      const user = await User.create({
        name: validatedData.name.trim(),
        email: emailClean,
        phone: phoneClean,
        password: hashedPassword,
        role: "user",
        isVerified: true,
        otpCode,
        otpExpiresAt,
        addresses: [],
      });

      // Also persist to resilient store
      createStoredUser({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        password: hashedPassword,
        role: "user",
        isVerified: true,
        createdAt: new Date().toISOString(),
      });

      const token = generateToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      await setAuthCookie(token);

      return NextResponse.json(
        {
          success: true,
          message: "Account created successfully.",
          data: {
            user: {
              id: user._id.toString(),
              name: user.name,
              email: user.email,
              phone: user.phone,
              role: user.role,
              isVerified: true,
            },
          },
        },
        { status: 201 }
      );
    } catch {
      // MongoDB offline, use resilient userStore
    }

    // 2. Resilient Offline Registration
    const existingStored = findStoredUser(emailClean);
    if (existingStored) {
      return NextResponse.json(
        { success: false, message: "Email already registered in system." },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(validatedData.password);
    const newStoredUser = createStoredUser({
      name: validatedData.name.trim(),
      email: emailClean,
      phone: phoneClean,
      password: hashedPassword,
      role: "user",
      isVerified: true,
      createdAt: new Date().toISOString(),
    });

    const token = generateToken({
      userId: newStoredUser.id,
      email: newStoredUser.email,
      role: newStoredUser.role,
    });

    await setAuthCookie(token);

    return NextResponse.json(
      {
        success: true,
        message: "Customer account created successfully.",
        data: {
          user: {
            id: newStoredUser.id,
            name: newStoredUser.name,
            email: newStoredUser.email,
            phone: newStoredUser.phone,
            role: newStoredUser.role,
            isVerified: true,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Validation error", errors: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    console.error("[API/auth/register] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}