import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AdminFeatureFlagsPageView from "@/features/admin/feature-flags/AdminFeatureFlagsPageView";
import { apiPath, browserApiFetch } from "@/lib/api/browserApi";

const executeAsync = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/browserApi", () => ({
  apiPath: vi.fn((p: string) => p),
  browserApiFetch: vi.fn(),
}));

vi.mock("next-safe-action/hooks", () => ({
  useAction: () => ({
    executeAsync,
    isExecuting: false,
  }),
}));

vi.mock("@/features/admin/feature-flags/updateFeatureFlagsAction", () => ({
  updateFeatureFlagsAction: vi.fn(),
}));

vi.mock("@/lib/featureFlags", () => ({
  getAllFlagsGrouped: () => [
    {
      group: "General",
      flags: [
        { name: "flag_a", description: "Flag A", defaultValue: false },
        { name: "flag_b", description: "Flag B", defaultValue: true },
      ],
    },
  ],
}));

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}): Response {
  const status = init.status ?? (init.ok === false ? 500 : 200);
  const ok = init.ok ?? (status >= 200 && status < 300);
  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

/** Under full-suite fork contention, React updates can exceed the 5s default. */
const LOAD_TIMEOUT_MS = 20_000;
/** Whole-case budget: several waitFor/findBy calls share this (not each alone). */
const CASE_TIMEOUT_MS = 60_000;

describe("AdminFeatureFlagsPageView (name-mirror)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it(
    "loads flags and shows source",
    async () => {
      vi.mocked(browserApiFetch).mockResolvedValue(
        jsonResponse({
          success: true,
          flags: { flag_a: true, flag_b: false },
          source: "database",
        }),
      );

      render(<AdminFeatureFlagsPageView />);

      await waitFor(
        () => expect(apiPath).toHaveBeenCalledWith("/api/admin/features"),
        { timeout: LOAD_TIMEOUT_MS },
      );
      expect(
        await screen.findByText("Source: database", undefined, {
          timeout: LOAD_TIMEOUT_MS,
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Feature flags" }),
      ).toBeInTheDocument();

      const switchA = await screen.findByRole("switch", {
        name: /Flag A/i,
      }, { timeout: LOAD_TIMEOUT_MS });
      const switchB = await screen.findByRole("switch", {
        name: /Flag B/i,
      }, { timeout: LOAD_TIMEOUT_MS });
      expect(switchA).toHaveAttribute("aria-checked", "true");
      expect(switchB).toHaveAttribute("aria-checked", "false");
    },
    CASE_TIMEOUT_MS,
  );

  it(
    "surfaces load failure",
    async () => {
      vi.mocked(browserApiFetch).mockResolvedValue(
        jsonResponse({}, { ok: false, status: 500 }),
      );

      render(<AdminFeatureFlagsPageView />);

      expect(
        await screen.findByRole("alert", undefined, { timeout: LOAD_TIMEOUT_MS }),
      ).toHaveTextContent("Failed to load feature flags (500)");
    },
    CASE_TIMEOUT_MS,
  );

  it(
    "toggles via updateFeatureFlagsAction (safe-action)",
    async () => {
      vi.mocked(browserApiFetch).mockResolvedValue(
        jsonResponse({
          success: true,
          flags: { flag_a: false, flag_b: true },
          source: "database",
        }),
      );
      executeAsync.mockResolvedValue({ data: { source: "updated-db" } });

      render(<AdminFeatureFlagsPageView />);

      const switchA = await screen.findByRole("switch", {
        name: /Flag A/i,
      }, { timeout: LOAD_TIMEOUT_MS });
      await waitFor(
        () => {
          expect(switchA).not.toBeDisabled();
          expect(switchA).toHaveAttribute("aria-checked", "false");
        },
        { timeout: LOAD_TIMEOUT_MS },
      );

      fireEvent.click(switchA);

      await waitFor(
        () => {
          expect(executeAsync).toHaveBeenCalledWith({
            updates: { flag_a: true },
          });
        },
        { timeout: LOAD_TIMEOUT_MS },
      );

      await waitFor(
        () => {
          expect(switchA).toHaveAttribute("aria-checked", "true");
        },
        { timeout: LOAD_TIMEOUT_MS },
      );
      expect(
        await screen.findByText("Source: updated-db", undefined, {
          timeout: LOAD_TIMEOUT_MS,
        }),
      ).toBeInTheDocument();
    },
    CASE_TIMEOUT_MS,
  );

  it(
    "keeps prior flag state when action returns serverError",
    async () => {
      vi.mocked(browserApiFetch).mockResolvedValue(
        jsonResponse({
          success: true,
          flags: { flag_a: false, flag_b: true },
        }),
      );
      executeAsync.mockResolvedValue({ serverError: "Permission denied" });

      render(<AdminFeatureFlagsPageView />);

      const switchA = await screen.findByRole("switch", {
        name: /Flag A/i,
      }, { timeout: LOAD_TIMEOUT_MS });
      await waitFor(
        () => {
          expect(switchA).not.toBeDisabled();
        },
        { timeout: LOAD_TIMEOUT_MS },
      );
      fireEvent.click(switchA);

      expect(
        await screen.findByRole("alert", undefined, { timeout: LOAD_TIMEOUT_MS }),
      ).toHaveTextContent("Permission denied");
      expect(switchA).toHaveAttribute("aria-checked", "false");
    },
    CASE_TIMEOUT_MS,
  );
});
