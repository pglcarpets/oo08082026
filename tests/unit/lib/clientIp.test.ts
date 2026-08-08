import { describe, expect, it } from "vitest";
import { normalizeClientIp } from "@/lib/clientIp";

describe("normalizeClientIp", () => {
  it("maps loopback IPs to localhost for stable rate-limit keys", () => {
    expect(normalizeClientIp("127.0.0.1")).toBe("localhost");
    expect(normalizeClientIp("::1")).toBe("localhost");
    expect(normalizeClientIp(" 127.0.0.1 ")).toBe("localhost");
  });

  it("preserves other IPs and trims whitespace", () => {
    expect(normalizeClientIp("203.0.113.10")).toBe("203.0.113.10");
    expect(normalizeClientIp(" 203.0.113.10 ")).toBe("203.0.113.10");
  });
});
