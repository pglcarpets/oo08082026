import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCustomerQuery } from "@/features/site/contact/createCustomerQuery";
import { createSupabaseAuthAdminClient } from "@/platform/supabase/auth-admin";
import { rateLimit } from "@/lib/rateLimit";
import { API_ERROR_CODES } from "@/features/shared/api/ApiError";

vi.mock("@/platform/supabase/auth-admin", () => ({
  createSupabaseAuthAdminClient: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  rateLimit: vi.fn(),
}));

vi.mock("@/lib/email/sendStaffQueryNotification", () => ({
  sendStaffQueryNotification: vi.fn().mockResolvedValue({ ok: true }),
}));

describe("createCustomerQuery", () => {
  let mockSupabase: {
    from: ReturnType<typeof vi.fn>;
    insert: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: "query-1",
          created_at: "2026-01-01T00:00:00Z",
          email: "user@example.com",
          phone: "919876543210",
        },
        error: null,
      }),
    };
    vi.mocked(createSupabaseAuthAdminClient).mockReturnValue(
      mockSupabase as never,
    );
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      reset: 1,
      limit: 6,
      remaining: 5,
    });
  });

  it("returns success with follow-up links", async () => {
    const result = await createCustomerQuery(
      {
        name: "Alex",
        message: "Need 20 chairs",
        email: "user@example.com",
        phone: "919876543210",
      },
      { ip: "1.2.3.4" },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.queryId).toBe("query-1");
    expect(result.followUp.email).toContain("mailto:user@example.com");
    expect(result.followUp.whatsapp).toContain("https://wa.me/919876543210");
    expect(result.honeypot).toBe(false);
    expect(mockSupabase.from).toHaveBeenCalledWith("customer_queries");
  });

  it("returns rate_limited without insert", async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: false,
      reset: 100,
      limit: 6,
      remaining: 0,
    });
    const result = await createCustomerQuery(
      { name: "A", message: "Hi", email: "a@b.com" },
      { ip: "9.9.9.9" },
    );
    expect(result).toMatchObject({
      ok: false,
      kind: "rate_limited",
      code: API_ERROR_CODES.RATE_LIMIT_EXCEEDED,
      reset: 100,
    });
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it("returns honeypot success without persisting", async () => {
    const result = await createCustomerQuery(
      {
        name: "Bot",
        message: "spam",
        email: "bot@evil.com",
        website: "http://spam.example",
      },
      { ip: "1.1.1.1" },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.queryId).toBe("submitted");
    expect(result.honeypot).toBe(true);
    expect(result.followUp).toEqual({ email: null, whatsapp: null });
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it("returns validation when name/message missing", async () => {
    const result = await createCustomerQuery(
      { email: "a@b.com" },
      { ip: "1.1.1.1" },
    );
    expect(result).toMatchObject({
      ok: false,
      kind: "validation",
      message: "Name and message are required.",
      code: API_ERROR_CODES.MISSING_REQUIRED_FIELD,
    });
  });

  it("returns validation when neither email nor phone", async () => {
    const result = await createCustomerQuery(
      { name: "Alex", message: "Need chairs" },
      { ip: "1.1.1.1" },
    );
    expect(result).toMatchObject({
      ok: false,
      kind: "validation",
      message: "Please provide email or phone.",
    });
  });

  it("returns database error when insert fails", async () => {
    mockSupabase.single.mockResolvedValue({
      data: null,
      error: { message: "relation missing" },
    });
    const result = await createCustomerQuery(
      {
        name: "Alex",
        message: "Need chairs",
        email: "user@example.com",
      },
      { ip: "1.1.1.1" },
    );
    expect(result).toMatchObject({
      ok: false,
      kind: "database",
      message: "Unable to save query right now.",
      code: API_ERROR_CODES.DATABASE_ERROR,
    });
  });
});
