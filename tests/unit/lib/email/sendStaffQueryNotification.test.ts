import { describe, expect, it } from "vitest";

import {
  isResendSandboxFrom,
  parseRecipients,
  resolveStaffNotifyRecipients,
} from "@/lib/email/sendStaffQueryNotification";

const VERIFIED_FROM = "One&Only <ayush@oando.co.in>";

describe("sendStaffQueryNotification helpers", () => {
  it("parses comma and semicolon recipient lists", () => {
    expect(parseRecipients("a@x.com, b@y.com; c@z.com")).toEqual([
      "a@x.com",
      "b@y.com",
      "c@z.com",
    ]);
  });

  it("detects Resend sandbox from addresses", () => {
    expect(isResendSandboxFrom("One&Only <onboarding@resend.dev>")).toBe(true);
    expect(isResendSandboxFrom(VERIFIED_FROM)).toBe(false);
  });

  it("returns intended staff list unchanged for verified from addresses", () => {
    expect(
      resolveStaffNotifyRecipients("ayush@oando.co.in, backup@example.com", VERIFIED_FROM),
    ).toEqual({
      recipients: ["ayush@oando.co.in", "backup@example.com"],
    });
  });

  it("redirects sandbox from to RESEND_TEST_RECIPIENT only", () => {
    const prev = process.env.RESEND_TEST_RECIPIENT;
    process.env.RESEND_TEST_RECIPIENT = "mayoite@gmail.com";
    expect(
      resolveStaffNotifyRecipients(
        "ayush@oando.co.in, mayoite@gmail.com",
        "One&Only <onboarding@resend.dev>",
      ),
    ).toEqual({
      recipients: ["mayoite@gmail.com"],
      intended: ["ayush@oando.co.in", "mayoite@gmail.com"],
    });
    process.env.RESEND_TEST_RECIPIENT = prev;
  });

  it("requires RESEND_TEST_RECIPIENT when from is sandbox", () => {
    const prev = process.env.RESEND_TEST_RECIPIENT;
    delete process.env.RESEND_TEST_RECIPIENT;
    expect(
      resolveStaffNotifyRecipients("ayush@oando.co.in", "onboarding@resend.dev"),
    ).toEqual({ recipients: [] });
    process.env.RESEND_TEST_RECIPIENT = prev;
  });
});
