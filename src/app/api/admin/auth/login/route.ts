import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import { User } from "@/models";
import { verifyPassword, generateToken, setAuthCookie } from "@/lib/auth";
import { findStoredUser, verifyUserPassword } from "@/lib/userStore";
import { checkRateLimit, recordFailedAttempt, clearRateLimit } from "@/lib/rateLimit";

const adminLoginSchema = z.object({
  email: z.string().email("Valid official staff email is required"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  try {
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    const body = await request.json();
    const validatedData = adminLoginSchema.parse(body);
    const email = validatedData.email.trim().toLowerCase();
    const password = validatedData.password.trim();

    // 1. High-Security Rate Limiting Guard
    const rateCheck = checkRateLimit(`admin:${email}:${clientIp}`, {
      keyPrefix: "admin_login",
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes lockout
    });

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: `Administrative security lockout: Too many failed login attempts. Please wait ${Math.ceil(
            rateCheck.retryAfterSeconds / 60
          )} minutes before retrying.`,
        },
        { status: 429 }
      );
    }

    let authenticatedUser: {
      id: string;
      name: string;
      email: string;
      role: "admin" | "moderator" | "user";
    } | null = null;

    // 2. Database Lookup
    try {
      await connectDB();
      const user = await User.findOne({ email }).select("+password");
      if (user) {
        const isMatch = await verifyPassword(password, user.password);
        if (isMatch) {
          authenticatedUser = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
          };
        }
      }
    } catch {
      // Database offline fallback
    }

    // 3. Resilient Store Fallback (Staff Demo Accounts)
    if (!authenticatedUser) {
      const stored = findStoredUser(email);
      if (stored) {
        const isMatch = await verifyUserPassword(password, stored);
        if (isMatch) {
          authenticatedUser = {
            id: stored.id || stored._id || "usr-001",
            name: stored.name,
            email: stored.email,
            role: stored.role,
          };
        }
      }
    }

    // 4. Verification Check
    if (!authenticatedUser) {
      const failure = recordFailedAttempt(`admin:${email}:${clientIp}`, {
        keyPrefix: "admin_login",
        maxAttempts: 5,
        windowMs: 15 * 60 * 1000,
      });

      return NextResponse.json(
        {
          success: false,
          message: "Invalid administrator credentials.",
          remainingAttempts: failure.remaining,
        },
        { status: 401 }
      );
    }

    // 5. Strict Role Gate: End-Users/Customers are strictly barred from Admin Console
    if (authenticatedUser.role !== "admin" && authenticatedUser.role !== "moderator") {
      recordFailedAttempt(`admin:${email}:${clientIp}`, {
        keyPrefix: "admin_login",
        maxAttempts: 5,
        windowMs: 15 * 60 * 1000,
      });

      return NextResponse.json(
        {
          success: false,
          message: "Access Denied: Customer accounts cannot sign in to the Administrative Operations Console.",
        },
        { status: 403 }
      );
    }

    // 6. Login Successful - Clear Rate Limits & Issue Secure JWT Cookie
    clearRateLimit(`admin:${email}:${clientIp}`, "admin_login");

    const token = generateToken({
      userId: authenticatedUser.id,
      email: authenticatedUser.email,
      role: authenticatedUser.role,
    });

    await setAuthCookie(token);

    const response = NextResponse.json({
      success: true,
      message: `${
        authenticatedUser.role === "admin" ? "Super Administrator" : "Operations Moderator"
      } authenticated successfully.`,
      data: {
        user: {
          id: authenticatedUser.id,
          name: authenticatedUser.name,
          email: authenticatedUser.email,
          role: authenticatedUser.role,
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

    console.error("[API/admin/auth/login] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error during authentication." },
      { status: 500 }
    );
  }
}

