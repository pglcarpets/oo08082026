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

  it("shows a busy state while resending", async () => {
    let resolveResend: (value: unknown) => void = () => {};
    resend.mockReturnValue(
      new Promise((resolve) => {
        resolveResend = resolve;
      }),
    );

    render(<ResendVerificationButton email="ada@example.com" />);

    fireEvent.click(screen.getByRole("button", { name: "Resend email" }));
    expect(screen.getByRole("button", { name: "Sending..." })).toBeDisabled();

    resolveResend({ error: null });
    expect(await screen.findByText("Verification email sent!")).toBeInTheDocument();
  });

  it("resends the verification email and shows confirmation", async () => {
    render(<ResendVerificationButton email="ada@example.com" />);

    fireEvent.click(screen.getByRole("button", { name: "Resend email" }));

    await waitFor(() => {
      expect(resend).toHaveBeenCalledWith({
        type: "signup",
        email: "ada@example.com",
      });
    });

    expect(screen.getByText("Verification email sent!")).toBeInTheDocument();
  });
});