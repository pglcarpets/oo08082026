import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { CsrfBootstrap } from "@/components/security/CsrfBootstrap";
import { ensureCsrfToken } from "@/lib/api/browserApi";

vi.mock("@/lib/api/browserApi", () => ({
  ensureCsrfToken: vi.fn(),
}));

describe("CsrfBootstrap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls ensureCsrfToken once on mount and renders null", () => {
    vi.mocked(ensureCsrfToken).mockResolvedValue("csrf-token");

    const { container } = render(<CsrfBootstrap />);

    expect(ensureCsrfToken).toHaveBeenCalledTimes(1);
    expect(ensureCsrfToken).toHaveBeenCalledWith();
    expect(container.firstChild).toBeNull();
  });

  it("does not throw when ensureCsrfToken rejects and stays null in the DOM", async () => {
    vi.mocked(ensureCsrfToken).mockRejectedValue(new Error("Network Error"));

    let container: HTMLElement | undefined;
    expect(() => {
      container = render(<CsrfBootstrap />).container;
    }).not.toThrow();

    expect(ensureCsrfToken).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(container?.firstChild).toBeNull();
    });
  });

  it("calls ensureCsrfToken again after remount when mocks are cleared", () => {
    vi.mocked(ensureCsrfToken).mockResolvedValue("csrf-token");

    const first = render(<CsrfBootstrap />);
    expect(ensureCsrfToken).toHaveBeenCalledTimes(1);
    first.unmount();

    vi.clearAllMocks();
    vi.mocked(ensureCsrfToken).mockResolvedValue("csrf-token-2");

    const second = render(<CsrfBootstrap />);
    expect(ensureCsrfToken).toHaveBeenCalledTimes(1);
    expect(second.container.firstChild).toBeNull();
  });
});
