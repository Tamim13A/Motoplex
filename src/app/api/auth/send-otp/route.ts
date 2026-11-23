import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import { User } from "@/models";
import { generateOTP, getOTPExpiry } from "@/lib/auth";

const sendOtpSchema = z
  .object({
    email: z.string().email("Invalid email address").optional(),
    phone: z.string().optional(),
    type: z.enum(["register", "forgot_password"]).default("register"),
  })
  .refine((d) => Boolean(d.email || d.phone), {
    message: "Email or phone number is required",
  });

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validatedData = sendOtpSchema.parse(body);

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

    const user = await User.findOne(userQuery);

    if (validatedData.type === "register") {
      if (user) {
        return NextResponse.json(
          { success: false, message: "Email already registered" },
          { status: 400 }
        );
      }
    } else {
      if (!user) {
        return NextResponse.json(
          { success: false, message: "No account found with this email" },
          { status: 404 }
        );
      }
    }

    const otpCode = generateOTP();
    const otpExpiresAt = getOTPExpiry(10);

    if (user) {
      user.otpCode = otpCode;
      user.otpExpiresAt = otpExpiresAt;
      await user.save();
    }

    console.log(`[OTP] For ${validatedData.email}: ${otpCode} (expires: ${otpExpiresAt})`);

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully. Check your email/phone.",
      data: { otpCode }, // Only for development - remove in production
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Validation error", errors: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    console.error("[API/auth/send-otp] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}