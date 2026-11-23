import { isTokenRevoked } from "@/lib/tokenBlacklist";

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Edge-compatible JWT payload verification with active revocation checks.
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    // 1. Check if token was explicitly revoked / logged out
    if (isTokenRevoked(token)) {
      return null;
    }

    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload) as JWTPayload;

    // Expiry verification
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Standard Node runtime JWT signer for login/register endpoints.
 */
export function generateToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const jwt = require("jsonwebtoken");
  const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production-min-32-chars";
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
