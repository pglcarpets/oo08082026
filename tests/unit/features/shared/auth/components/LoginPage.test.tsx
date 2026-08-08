/**
 * Name-mirror: features/shared/auth/components/LoginPage
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { signInWithPassword, signOut, replace, searchParams } = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  replace: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock("@/platform/supabase/client", () => ({
  createAuthClient: () => ({
    auth: {
      signInWithPassword,
      signOut,
    },
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => searchParams,
}));

import { LoginForm, LoginPage } from "@/features/shared/auth/components/LoginPage";

describe("LoginForm", () => {
  beforeEach(() => {
    signInWithPassword.mockReset();
    signOut.mockReset();
    replace.mockReset();
    signOut.mockResolvedValue({ error: null });
    searchParams.delete("next");
  });

  it("signs in and redirects to the sanitized next path", async () => {
    signInWithPassword.mockResolvedValue({ error: null });
    searchParams.set("next", "/dashboard");

    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret-pass" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(signInWithPassword).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "secret-pass",
      });
      expect(replace).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows a humanized error for invalid credentials", async () => {
    signInWithPassword.mockResolvedValue({
      error: { message: "Invalid login credentials" },
    });

    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid login credentials",
    );
    expect(replace).not.toHaveBeenCalled();
  });

  it("redirects suspended users to /suspended after sign-out", async () => {
    signInWithPassword.mockResolvedValue({
      error: { message: "User is banned until 2099-01-01" },
    });

    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "banned@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret-pass" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
      expect(replace).toHaveBeenCalledWith("/suspended");
    });
  });

  it("calls onSuccess instead of redirecting when provided", async () => {
    signInWithPassword.mockResolvedValue({ error: null });
    const onSuccess = vi.fn();

    render(<LoginForm onSuccess={onSuccess} />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret-pass" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
      expect(replace).not.toHaveBeenCalled();
    });
  });
});

describe("LoginPage", () => {
  it("renders shell heading and auth navigation links", () => {
    render(<LoginPage />);
    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Forgot password?" })).toHaveAttribute(
      "href",
      "/forgot",
    );
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute(
      "href",
      "/signup",
    );
  });
});
