import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import { User } from "@/models";
import { hashPassword } from "@/lib/auth";

const resetPasswordSchema = z
  .object({
    email: z.string().email("Invalid email address").optional(),
    phone: z.string().optional(),
    otpCode: z.string().length(6, "OTP must be 6 digits"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
  })
  .refine((d) => Boolean(d.email || d.phone), {
    message: "Email or phone number is required",
  });

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validatedData = resetPasswordSchema.parse(body);

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
        { success: false, message: "No account found with this identifier" },
        { status: 404 }
      );
    }

    if (!user.otpCode || !user.otpExpiresAt) {
      return NextResponse.json(
        { success: false, message: "No OTP request active for this account. Please request a new code." },
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
        { success: false, message: "OTP has expired. Please request a new code." },
        { status: 400 }
      );
    }

    // Hash and update password
    user.password = await hashPassword(validatedData.newPassword);
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Password reset successfully. You can now sign in with your new password.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Validation error", errors: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    console.error("[API/auth/reset-password] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
