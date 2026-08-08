/**
 * Name-mirror: features/shared/auth/components/AuthShell
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  AuthErrorBanner,
  AuthFieldLabel,
  AuthHeading,
  AuthLinks,
  AuthShell,
} from "@/features/shared/auth/components/AuthShell";

describe("AuthShell", () => {
  it("renders brand chrome without changing title when documentTitle is omitted", () => {
    document.title = "Stable title";
    render(
      <AuthShell>
        <div>Auth body</div>
      </AuthShell>,
    );
    expect(screen.getByRole("link", { name: "One&Only home" })).toBeInTheDocument();
    expect(screen.getByAltText("One&Only Furniture")).toBeInTheDocument();
    expect(screen.getByText("Auth body")).toBeInTheDocument();
    expect(document.title).toBe("Stable title");
  });

  it("sets and restores document title when documentTitle is provided", () => {
    document.title = "Previous";
    const { unmount } = render(
      <AuthShell documentTitle="Sign in">
        <div>Body</div>
      </AuthShell>,
    );
    expect(document.title).toBe("Sign in — One&Only");
    unmount();
    expect(document.title).toBe("Previous");
  });
});

describe("AuthShell primitives", () => {
  it("renders heading, error banner, field label, and links", () => {
    render(
      <>
        <AuthHeading title="Welcome back" subtitle="Sign in to continue." />
        <AuthErrorBanner id="err" message="Invalid credentials" />
        <AuthFieldLabel htmlFor="email" label="Email">
          <input id="email" />
        </AuthFieldLabel>
        <AuthLinks>
          <a href="/forgot">Forgot password?</a>
        </AuthLinks>
      </>,
    );

    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    expect(screen.getByText("Sign in to continue.")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid credentials");
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Forgot password?" })).toHaveAttribute(
      "href",
      "/forgot",
    );
  });
});
