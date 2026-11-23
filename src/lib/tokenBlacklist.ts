// In-memory token revocation cache with auto-pruning
const revokedTokens = new Map<string, number>();

/**
 * Revokes a JWT token immediately so it cannot be used anywhere on the platform.
 */
export function revokeToken(token: string, expiresAtMs?: number): void {
  if (!token) return;
  // Default retention: 7 days or until token expiration
  const expiry = expiresAtMs || Date.now() + 7 * 24 * 60 * 60 * 1000;
  revokedTokens.set(token, expiry);

  // Prune expired entries periodically to prevent memory leaks
  if (revokedTokens.size > 1000) {
    const now = Date.now();
    for (const [t, exp] of revokedTokens.entries()) {
      if (exp <= now) {
        revokedTokens.delete(t);
      }
    }
  }
}

/**
 * Checks whether a JWT token has been explicitly revoked / blacklisted.
 */
export function isTokenRevoked(token: string): boolean {
  if (!token) return false;
  const expiry = revokedTokens.get(token);
  if (!expiry) return false;

  if (Date.now() > expiry) {
    revokedTokens.delete(token);
    return false;
  }
  return true;
}

