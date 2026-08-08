import { describe, it, expect, vi, beforeEach } from "vitest";
import type { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { cookies } from "next/headers";
import {
  generateCsrfToken,
  validateCsrfToken,
  setCsrfTokenCookie,
  getCsrfTokenFromCookie,
  getCsrfTokenFromHeader,
  validateCsrfRequest,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
} from "@/lib/security/csrf";

function cookie(value: string): RequestCookie {
  return { name: CSRF_COOKIE_NAME, value };
}

vi.mock("next/headers", () => {
  const mockSet = vi.fn();
  const mockGet = vi.fn();
  return {
    cookies: vi.fn(async () => ({
      set: mockSet,
      get: mockGet,
    })),
  };
});

describe("csrf security utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateCsrfToken", () => {
    it("should return a valid UUID string", () => {
      const token = generateCsrfToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token).toHaveLength(36); // UUID v4 length
    });
  });

  describe("validateCsrfToken", () => {
    it("should return true for identical tokens", () => {
      const token = "some-random-csrf-token";
      expect(validateCsrfToken(token, token)).toBe(true);
    });

    it("should return false for different tokens", () => {
      expect(validateCsrfToken("token-a", "token-b")).toBe(false);
    });

    it("should return false if one token is empty or has different length", () => {
      expect(validateCsrfToken("", "token")).toBe(false);
      expect(validateCsrfToken("tok", "token")).toBe(false);
    });
  });

  describe("setCsrfTokenCookie", () => {
    it("should call cookies.set with correct options", async () => {
      const token = "csrf-token-xyz";
      const mockStore = await cookies();
      await setCsrfTokenCookie(token);

      expect(mockStore.set).toHaveBeenCalledWith(
        CSRF_COOKIE_NAME,
        token,
        expect.objectContaining({
          httpOnly: true,
          sameSite: "strict",
          path: "/",
        })
      );
    });
  });

  describe("getCsrfTokenFromCookie", () => {
    it("should return cookie value if found", async () => {
      const mockStore = await cookies();
      vi.mocked(mockStore.get).mockReturnValue(cookie("stored-token"));

      const token = await getCsrfTokenFromCookie();
      expect(token).toBe("stored-token");
    });

    it("should return null if cookie is not set", async () => {
      const mockStore = await cookies();
      vi.mocked(mockStore.get).mockReturnValue(undefined);

      const token = await getCsrfTokenFromCookie();
      expect(token).toBeNull();
    });
  });

  describe("getCsrfTokenFromHeader", () => {
    it("should retrieve token from Request headers", () => {
      const request = new Request("http://localhost/api", {
        headers: {
          [CSRF_HEADER_NAME]: "header-token-123",
        },
      });
      const token = getCsrfTokenFromHeader(request);
      expect(token).toBe("header-token-123");
    });

    it("should return null if token header is not present", () => {
      const request = new Request("http://localhost/api");
      const token = getCsrfTokenFromHeader(request);
      expect(token).toBeNull();
    });
  });

  describe("validateCsrfRequest", () => {
    it("should return true if header and cookie tokens match", async () => {
      const mockStore = await cookies();
      vi.mocked(mockStore.get).mockReturnValue(cookie("matching-token"));

      const request = new Request("http://localhost/api", {
        headers: {
          [CSRF_HEADER_NAME]: "matching-token",
        },
      });

      const isValid = await validateCsrfRequest(request);
      expect(isValid).toBe(true);
    });

    it("should return false if header token is missing", async () => {
      const mockStore = await cookies();
      vi.mocked(mockStore.get).mockReturnValue(cookie("matching-token"));

      const request = new Request("http://localhost/api");

      const isValid = await validateCsrfRequest(request);
      expect(isValid).toBe(false);
    });

    it("should return false if cookie token is missing", async () => {
      const mockStore = await cookies();
      vi.mocked(mockStore.get).mockReturnValue(undefined);

      const request = new Request("http://localhost/api", {
        headers: {
          [CSRF_HEADER_NAME]: "matching-token",
        },
      });

      const isValid = await validateCsrfRequest(request);
      expect(isValid).toBe(false);
    });
  });
});
