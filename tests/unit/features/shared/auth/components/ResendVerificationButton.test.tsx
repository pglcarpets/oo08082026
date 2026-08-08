/**
 * Name-mirror: features/shared/auth/components/ResendVerificationButton
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { resend } = vi.hoisted(() => ({
  resend: vi.fn(),
}));

vi.mock("@/platform/supabase/client", () => ({
  createAuthClient: () => ({
    auth: { resend },
  }),
}));

import { ResendVerificationButton } from "@/features/shared/auth/components/ResendVerificationButton";

describe("ResendVerificationButton", () => {
  beforeEach(() => {
    resend.mockReset();
    resend.mockResolvedValue({ error: null });
  });

  it("resends signup verification and shows success copy", async () => {
    render(<ResendVerificationButton email="ada@example.com" />);

    fireEvent.click(screen.getByRole("button", { name: "Resend email" }));

    await waitFor(() => {
      expect(resend).toHaveBeenCalledWith({
        type: "signup",
        email: "ada@example.com",
      });
    });

    expect(screen.getByText("Verification email sent!")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Resend email" })).not.toBeInTheDocument();
  });
});
