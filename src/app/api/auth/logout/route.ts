import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";
import { revokeToken } from "@/lib/tokenBlacklist";

export async function POST(request: NextRequest) {
  try {
    // 1. Extract active token to blacklist immediately
    const token =
      request.cookies.get("motoplex_token")?.value ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (token) {
      revokeToken(token);
    }

    await clearAuthCookie();

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    // Explicitly enforce cookie expiration on the HTTP response headers to prevent browser race conditions
    response.cookies.set("motoplex_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    console.error("[API/auth/logout] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}