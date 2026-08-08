/**
 * Name-mirror: features/shared/auth/components/SignupPage
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { signUp, resend, searchParams } = vi.hoisted(() => ({
  signUp: vi.fn(),
  resend: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock("@/platform/supabase/client", () => ({
  createAuthClient: () => ({
    auth: {
      signUp,
      resend,
    },
  }),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
}));

import { SignupForm, SignupPage } from "@/features/shared/auth/components/SignupPage";

describe("SignupForm", () => {
  beforeEach(() => {
    signUp.mockReset();
    resend.mockReset();
    sessionStorage.clear();
    searchParams.delete("invite");
    searchParams.delete("email");
    resend.mockResolvedValue({ error: null });
  });

  it("creates an account and shows verification success", async () => {
    signUp.mockResolvedValue({ error: null });

    render(<SignupForm />);
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Ada Lovelace" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "long-enough" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(signUp).toHaveBeenCalledWith({
        email: "ada@example.com",
        password: "long-enough",
        options: { data: { name: "Ada Lovelace" } },
      });
    });

    expect(
      screen.getByRole("heading", { name: "Check your inbox" }),
    ).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
  });

  it("shows a humanized error when signup fails", async () => {
    signUp.mockResolvedValue({
      error: { message: "User already registered" },
    });

    render(<SignupForm />);
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Ada Lovelace" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "long-enough" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "User already registered",
    );
  });

  it("stores legacy invite tokens and strips them from the url", () => {
    searchParams.set("invite", "legacy-token-123");
    const replaceState = vi.spyOn(window.history, "replaceState");

    render(<SignupForm />);

    expect(sessionStorage.getItem("pending_invite_token")).toBe("legacy-token-123");
    expect(replaceState).toHaveBeenCalled();
    replaceState.mockRestore();
  });
});

describe("SignupPage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    searchParams.delete("invite");
  });

  it("renders the signup shell and sign-in link", () => {
    render(<SignupPage />);
    expect(
      screen.getByRole("heading", { name: "Create your workspace" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
