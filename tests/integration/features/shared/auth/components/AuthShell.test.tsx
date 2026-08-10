import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  AuthErrorBanner,
  AuthFieldLabel,
  AuthHeading,
  AuthLinks,
  AuthShell,
} from "@/features/shared/auth/components/AuthShell";

describe("AuthShell", () => {
  it("renders without changing the title when documentTitle is omitted", () => {
    document.title = "Stable title";

    render(
      <AuthShell>
        <div>Untitled auth body</div>
      </AuthShell>,
    );

    expect(screen.getByText("Untitled auth body")).toBeInTheDocument();
    expect(document.title).toBe("Stable title");
  });

  it("renders shared auth chrome and manages document title", () => {
    document.title = "Previous title";

    const { unmount } = render(
      <AuthShell documentTitle="Sign in">
        <div>Auth body</div>
      </AuthShell>,
    );

    expect(screen.getByRole("link", { name: "One&Only home" })).toBeInTheDocument();
    expect(screen.getByAltText("One&Only Furniture")).toBeInTheDocument();
    expect(screen.getByText("Auth body")).toBeInTheDocument();
    expect(document.title).toBe("Sign in — One&Only");

    unmount();

    expect(document.title).toBe("Previous title");
  });

  it("renders heading, field labels, links, and error banners", () => {
    render(
      <>
        <AuthHeading title="Welcome back" subtitle="Sign in to your workspace." />
        <AuthErrorBanner id="auth-error" message="Invalid credentials" />
        <AuthFieldLabel htmlFor="email" label="Email">
          <input id="email" />
        </AuthFieldLabel>
        <AuthLinks>
          <a href="/forgot">Forgot password?</a>
        </AuthLinks>
      </>,
    );

    expect(
      screen.getByRole("heading", { name: "Welcome back" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Sign in to your workspace.")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid credentials");
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Forgot password?" })).toHaveAttribute(
      "href",
      "/forgot",
    );
  });
});
