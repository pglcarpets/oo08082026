/**
 * CSRF protection utilities for API routes.
 * Implements double-submit cookie pattern with timing-safe comparison.
 */
import "server-only";

import { cookies } from "next/headers";
import { timingSafeEqual } from "crypto";

import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "./csrfConstants";

export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME };

/**
 * Generate a cryptographically secure CSRF token.
 */
export function generateCsrfToken(): string {
  return crypto.randomUUID();
}

/**
 * Validate a CSRF token using timing-safe comparison.
 * Prevents timing attacks that could leak token information.
 */
export function validateCsrfToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken) {return false;}
  if (token.length !== expectedToken.length) {return false;}

  const tokenBuffer = Buffer.from(token);
  const expectedBuffer = Buffer.from(expectedToken);

  return timingSafeEqual(tokenBuffer, expectedBuffer);
}

/**
 * Set the CSRF token cookie.
 * HttpOnly, secure, sameSite=strict to prevent XSS and CSRF attacks.
 */
export async function setCsrfTokenCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

/**
 * Get CSRF token from cookie.
 */
export async function getCsrfTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_COOKIE_NAME)?.value ?? null;
}

/**
 * Get CSRF token from request header.
 */
export function getCsrfTokenFromHeader(request: Request): string | null {
  return request.headers.get(CSRF_HEADER_NAME);
}

/**
 * Validate CSRF token in a request.
 * Compares header token with cookie token using timing-safe comparison.
 */
export async function validateCsrfRequest(request: Request): Promise<boolean> {
  const headerToken = getCsrfTokenFromHeader(request);
  const cookieToken = await getCsrfTokenFromCookie();

  if (!headerToken || !cookieToken) {return false;}

  return validateCsrfToken(headerToken, cookieToken);
}
