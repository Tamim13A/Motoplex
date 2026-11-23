import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/token";

function getTokenFromRequest(request: NextRequest): string | undefined {
  const cookieToken = request.cookies.get("motoplex_token")?.value;
  if (cookieToken) return cookieToken;

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  return undefined;
}

// Routes restricted from moderators (Super Admin only)
const MODERATOR_RESTRICTED_PAGES = [
  "/admin/users",
  "/admin/settings",
  "/admin/reports",
];

const MODERATOR_RESTRICTED_APIS = [
  "/api/admin/users",
  "/api/admin/settings",
  "/api/admin/reports",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Dedicated Staff Login Page (/admin/login)
  if (pathname === "/admin/login") {
    // If navigating from an explicit sign-out, bypass any cached token checks and enforce cookie destruction
    if (request.nextUrl.searchParams.get("logged_out") === "true") {
      const response = NextResponse.next();
      response.cookies.set("motoplex_token", "", {
        path: "/",
        maxAge: 0,
        expires: new Date(0),
      });
      return response;
    }

    const token = getTokenFromRequest(request);
    if (token) {
      const decoded = verifyToken(token);
      if (decoded && (decoded.role === "admin" || decoded.role === "moderator")) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      if (decoded && decoded.role === "user") {
        // Customer has no business on admin login page
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
    // Allow unauthenticated staff to access /admin/login
    return NextResponse.next();
  }

  // 2. Allow Admin Auth Login API endpoint without existing token
  if (pathname === "/api/admin/auth/login") {
    return NextResponse.next();
  }

  // 3. Admin Pages (/admin and /admin/*)
  if (pathname.startsWith("/admin")) {
    const token = getTokenFromRequest(request);
    if (!token) {
      const adminLoginUrl = new URL("/admin/login", request.url);
      if (pathname !== "/admin") {
        adminLoginUrl.searchParams.set("redirect", pathname);
      }
      return NextResponse.redirect(adminLoginUrl);
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    // End-users (Customers) must NEVER access admin dashboard
    if (decoded.role === "user") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Role: Moderator - Limited Control Check
    if (decoded.role === "moderator") {
      const isRestrictedPage = MODERATOR_RESTRICTED_PAGES.some((prefix) =>
        pathname.startsWith(prefix)
      );
      if (isRestrictedPage) {
        const deniedUrl = new URL("/admin", request.url);
        deniedUrl.searchParams.set("error", "restricted_module");
        return NextResponse.redirect(deniedUrl);
      }
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", decoded.userId);
    requestHeaders.set("x-user-email", decoded.email);
    requestHeaders.set("x-user-role", decoded.role);

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });

    // Zero-Trust Security & Anti-Back-Button Cache Guard
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");

    return response;
  }

  // 4. Admin API Routes (/api/admin and /api/admin/*)
  if (pathname.startsWith("/api/admin")) {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Staff authentication required" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    if (decoded.role === "user") {
      return NextResponse.json(
        { success: false, message: "Forbidden: Customer accounts cannot access administrative APIs" },
        { status: 403 }
      );
    }

    // Moderator restrictions on APIs & Deletions
    if (decoded.role === "moderator") {
      const isRestrictedApi = MODERATOR_RESTRICTED_APIS.some((prefix) =>
        pathname.startsWith(prefix)
      );
      if (isRestrictedApi) {
        return NextResponse.json(
          { success: false, message: "Forbidden: Super Administrator privilege required" },
          { status: 403 }
        );
      }

      if (request.method === "DELETE") {
        return NextResponse.json(
          { success: false, message: "Forbidden: Moderators cannot delete records" },
          { status: 403 }
        );
      }
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", decoded.userId);
    requestHeaders.set("x-user-email", decoded.email);
    requestHeaders.set("x-user-role", decoded.role);

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });

    // Zero-Trust Security & Anti-Back-Button Cache Guard
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");

    return response;
  }

  // 5. Customer Account Routes (/account and /account/*)
  if (pathname.startsWith("/account")) {
    const token = getTokenFromRequest(request);
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", decoded.userId);
    requestHeaders.set("x-user-email", decoded.email);
    requestHeaders.set("x-user-role", decoded.role);

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });

    // Zero-Trust Security & Anti-Back-Button Cache Guard
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");

    return response;
  }

  // 6. Protected User API Routes (/api/auth/me)
  if (pathname === "/api/auth/me") {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", decoded.userId);
    requestHeaders.set("x-user-email", decoded.email);
    requestHeaders.set("x-user-role", decoded.role);

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });

    // Zero-Trust Security & Anti-Back-Button Cache Guard
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/account/:path*",
    "/api/auth/me",
  ],
};
