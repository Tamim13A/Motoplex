import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import { User } from "@/models";
import { generateToken, setAuthCookie } from "@/lib/auth";

const verifyOtpSchema = z
  .object({
    email: z.string().email("Invalid email address").optional(),
    phone: z.string().optional(),
    otpCode: z.string().length(6, "OTP must be 6 digits"),
    type: z.enum(["register", "forgot_password"]).default("register"),
  })
  .refine((d) => Boolean(d.email || d.phone), {
    message: "Email or phone number is required",
  });

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validatedData = verifyOtpSchema.parse(body);

    const userQuery = validatedData.email
      ? { email: validatedData.email.toLowerCase() }
      : {
          phone: {
            $in: [
              validatedData.phone,
              validatedData.phone?.replace(/^0/, "+880"),
              `+88${validatedData.phone}`,
            ],
          },
        };

    const user = await User.findOne(userQuery).select("+otpCode +otpExpiresAt +password");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (!user.otpCode || !user.otpExpiresAt) {
      return NextResponse.json(
        { success: false, message: "No OTP requested for this account" },
        { status: 400 }
      );
    }

    if (user.otpCode !== validatedData.otpCode) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP code" },
        { status: 400 }
      );
    }

    if (new Date() > user.otpExpiresAt) {
      return NextResponse.json(
        { success: false, message: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    user.isVerified = true;
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    if (validatedData.type === "register") {
      const token = generateToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      await setAuthCookie(token);

      return NextResponse.json({
        success: true,
        message: "Email verified successfully. Welcome to MOTOPLEX BD!",
        data: {
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isVerified: user.isVerified,
            addresses: user.addresses,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully. You can now reset your password.",
      data: { userId: user._id.toString() },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Validation error", errors: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    console.error("[API/auth/verify-otp] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}