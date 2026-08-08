import "@/tests/helpers/nextIntlServerEnMock";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { redirect } from "next/navigation";
import AccessPage from "@/app/(site)/access/page";
import { getOptionalUser } from "@/lib/auth/session";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  usePathname: () => "/access",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/auth/session", () => ({
  getOptionalUser: vi.fn(),
}));

vi.mock("@/app/(site)/access/AccessForm", () => ({
  AccessForm: ({ nextPath, guestHref }: { nextPath: string; guestHref: string }) => (
    <div data-testid="access-form" data-next={nextPath} data-guest={guestHref} />
  ),
}));

describe("app/(site)/access/page.tsx", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the access form for unauthenticated users", async () => {
    vi.mocked(getOptionalUser).mockResolvedValue(null);

    const page = await AccessPage({});
    render(page);

    expect(screen.getByTestId("access-form")).toBeInTheDocument();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects authenticated users to their next path", async () => {
    vi.mocked(getOptionalUser).mockResolvedValue({ id: "user-1", email: "user@example.com" } as never);

    await AccessPage({ searchParams: Promise.resolve({ next: "/dashboard" }) });

    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });
});
