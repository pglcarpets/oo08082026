import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runKpiCanonicalIntegrityCheck } from "@/lib/analytics/kpiIntegrity";
import { compareKpiField } from "@/lib/analytics/kpiEvents";

vi.mock("@/lib/analytics/kpiEvents", () => ({
  compareKpiField: vi.fn(),
}));

describe("kpiIntegrity", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls fetch and compareKpiField on success", async () => {
    const mockJson = {
      stats: {
        projectsDelivered: 100,
        clientOrganisations: 50,
        sectorsServed: 10,
      },
    };
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockJson), { status: 200 }),
    );

    await runKpiCanonicalIntegrityCheck("test-page", {
      projectsDelivered: 90,
      clientOrganisations: 50,
      sectorsServed: 10,
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/business-stats", {
      method: "GET",
      signal: undefined,
      cache: "no-store",
    });
    expect(compareKpiField).toHaveBeenCalledWith("test-page", "projectsDelivered", 90, 100);
    expect(compareKpiField).toHaveBeenCalledWith("test-page", "clientOrganisations", 50, 50);
    expect(compareKpiField).toHaveBeenCalledWith("test-page", "sectorsServed", 10, 10);
  });

  it("catches errors silently on network failure", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockRejectedValueOnce(new Error("Network Error"));

    await expect(
      runKpiCanonicalIntegrityCheck("test-page", {
        projectsDelivered: 90,
        clientOrganisations: 50,
        sectorsServed: 10,
      })
    ).resolves.not.toThrow();

    expect(compareKpiField).not.toHaveBeenCalled();
  });
});
