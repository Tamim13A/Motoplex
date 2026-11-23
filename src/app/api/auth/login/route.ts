import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import { User } from "@/models";
import { verifyPassword, generateToken, setAuthCookie } from "@/lib/auth";
import { findStoredUser, verifyUserPassword } from "@/lib/userStore";
import { checkRateLimit, recordFailedAttempt, clearRateLimit } from "@/lib/rateLimit";

const loginSchema = z
  .object({
    identifier: z.string().optional(),
    email: z.string().optional(),
    password: z.string().min(1, "Password is required"),
    rememberMe: z.boolean().optional(),
  })
  .refine((data) => Boolean(data.identifier || data.email), {
    message: "Email or mobile phone number is required",
    path: ["identifier"],
  });

export async function POST(request: NextRequest) {
  try {
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    const body = await request.json();
    const validatedData = loginSchema.parse(body);
    const rawIdentifier = (validatedData.identifier || validatedData.email || "").trim().toLowerCase();
    const inputPassword = validatedData.password.trim();

    // 1. High-Security Rate Limiting
    const rateCheck = checkRateLimit(`customer:${rawIdentifier}:${clientIp}`, {
      keyPrefix: "customer_login",
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 mins lock
    });

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: `Too many failed sign in attempts. For account security, please try again in ${Math.ceil(
            rateCheck.retryAfterSeconds / 60
          )} minutes.`,
        },
        { status: 429 }
      );
    }

    let authenticatedUser: any = null;

    // 2. Try MongoDB database lookup if online
    try {
      await connectDB();
      const isEmail = rawIdentifier.includes("@");
      const query = isEmail
        ? { email: rawIdentifier }
        : { phone: { $in: [rawIdentifier, rawIdentifier.replace(/^0/, "+880"), `+88${rawIdentifier}`] } };

      const user = await User.findOne(query).select("+password");
      if (user) {
        const isPasswordValid = await verifyPassword(inputPassword, user.password);
        if (isPasswordValid) {
          authenticatedUser = user;
        }
      }
    } catch {
      // MongoDB offline, fallback to resilient userStore
    }

    // 3. Resilient Fallback: Stored Accounts
    if (!authenticatedUser) {
      const storedUser = findStoredUser(rawIdentifier);
      if (storedUser) {
        const isPasswordValid = await verifyUserPassword(inputPassword, storedUser);
        if (isPasswordValid) {
          authenticatedUser = storedUser;
        }
      }
    }

    // 4. Verification Check
    if (!authenticatedUser) {
      const failure = recordFailedAttempt(`customer:${rawIdentifier}:${clientIp}`, {
        keyPrefix: "customer_login",
        maxAttempts: 5,
        windowMs: 15 * 60 * 1000,
      });

      return NextResponse.json(
        {
          success: false,
          message: "Invalid email/phone or password. Please verify and try again.",
          remainingAttempts: failure.remaining,
        },
        { status: 401 }
      );
    }

    // 5. Successful Login - Clear Rate Limit & Set Cookie
    clearRateLimit(`customer:${rawIdentifier}:${clientIp}`, "customer_login");

    const token = generateToken({
      userId: authenticatedUser._id?.toString() || authenticatedUser.id || "usr-001",
      email: authenticatedUser.email,
      role: authenticatedUser.role || "user",
    });

    await setAuthCookie(token);

    const response = NextResponse.json({
      success: true,
      message: "Signed in successfully",
      data: {
        user: {
          id: authenticatedUser._id?.toString() || authenticatedUser.id,
          name: authenticatedUser.name,
          email: authenticatedUser.email,
          phone: authenticatedUser.phone,
          role: authenticatedUser.role || "user",
          isVerified: authenticatedUser.isVerified,
          addresses: authenticatedUser.addresses || [],
        },
      },
    });

    // Explicitly guarantee Set-Cookie header on outgoing response object
    response.cookies.set("motoplex_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Validation error", errors: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    console.error("[API/auth/login] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error during authentication." },
      { status: 500 }
    );
  }
}
