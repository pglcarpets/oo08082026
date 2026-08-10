/**
 * Client path contract for @planner/lib/plannerApi.
 * Locks the target HTTP surface CRM (and other callers) should repoint to:
 *   /api/Planner/projects[/:id]  (case-sensitive Planner segment)
 *   /api/Planner/catalog[+upload]
 *   /api/exports
 *
 * Member saves (no DEV_AUTH_BYPASS) go through browserApiFetch so CSRF +
 * credentials + trailingSlash are applied.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const browserApiMocks = vi.hoisted(() => ({
  browserApiFetch: vi.fn(),
  apiPath: vi.fn((path: string) =>
    path.endsWith("/") || path.includes("?") ? path : `${path}/`,
  ),
}));

vi.mock("@/lib/api/browserApi", () => ({
  browserApiFetch: (...args: unknown[]) => browserApiMocks.browserApiFetch(...args),
  apiPath: (path: string) => browserApiMocks.apiPath(path),
}));

import {
  createExport,
  createProject,
  deleteProject,
  fileUrl,
  getProject,
  listFurniture,
  listProjects,
  updateProject,
  uploadFurniture,
} from "@planner/lib/plannerApi";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("@planner/lib/plannerApi path contract", () => {
  beforeEach(() => {
    browserApiMocks.browserApiFetch.mockReset();
    browserApiMocks.apiPath.mockClear();
    browserApiMocks.browserApiFetch.mockResolvedValue(jsonResponse({}));
  });

  it("lists projects at GET /api/Planner/projects", async () => {
    browserApiMocks.browserApiFetch.mockResolvedValueOnce(
      jsonResponse([{ id: "p_1" }]),
    );
    const data = await listProjects();
    expect(browserApiMocks.browserApiFetch).toHaveBeenCalledWith(
      "/api/Planner/projects",
    );
    expect(data).toEqual([{ id: "p_1" }]);
  });

  it("gets a project at GET /api/Planner/projects/:id", async () => {
    browserApiMocks.browserApiFetch.mockResolvedValueOnce(
      jsonResponse({ id: "p_1" }),
    );
    await getProject("p_1");
    expect(browserApiMocks.browserApiFetch).toHaveBeenCalledWith(
      "/api/Planner/projects/p_1",
    );
  });

  it("creates a project at POST /api/Planner/projects with JSON body", async () => {
    const payload = { name: "A", canvas_json: {} };
    browserApiMocks.browserApiFetch.mockResolvedValueOnce(
      jsonResponse({ id: "p_a_x" }, 201),
    );
    await createProject(payload);
    expect(browserApiMocks.browserApiFetch).toHaveBeenCalledWith(
      "/api/Planner/projects",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
  });

  it("updates a project at PATCH /api/Planner/projects/:id", async () => {
    const payload = { name: "B" };
    await updateProject("p_1", payload);
    expect(browserApiMocks.browserApiFetch).toHaveBeenCalledWith(
      "/api/Planner/projects/p_1",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
  });

  it("deletes a project at DELETE /api/Planner/projects/:id", async () => {
    await deleteProject("p_1");
    expect(browserApiMocks.browserApiFetch).toHaveBeenCalledWith(
      "/api/Planner/projects/p_1",
      { method: "DELETE" },
    );
  });

  it("lists furniture catalog at GET /api/Planner/catalog (never /Studio)", async () => {
    await listFurniture({ category: "desks" });
    expect(browserApiMocks.browserApiFetch).toHaveBeenCalledWith(
      "/api/Planner/catalog?category=desks",
    );
    const path = String(browserApiMocks.browserApiFetch.mock.calls[0]?.[0] ?? "");
    expect(path).not.toMatch(/Studio/i);
  });

  it("uploads furniture via /api/Planner/catalog/upload (CSRF path)", async () => {
    const form = new FormData();
    form.append("name", "Custom");
    await uploadFurniture(form);
    expect(browserApiMocks.apiPath).toHaveBeenCalledWith(
      "/api/Planner/catalog/upload",
    );
    expect(browserApiMocks.browserApiFetch).toHaveBeenCalledWith(
      "/api/Planner/catalog/upload/",
      { method: "POST", body: form },
    );
  });

  it("posts exports at POST /api/exports (neutral, not Studio)", async () => {
    const payload = { data_url: "data:image/png;base64,xx", format: "png" };
    await createExport(payload);
    expect(browserApiMocks.browserApiFetch).toHaveBeenCalledWith("/api/exports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  });

  it("surfaces API error detail when response is not ok", async () => {
    browserApiMocks.browserApiFetch.mockResolvedValueOnce(
      jsonResponse({ detail: "Authentication required" }, 401),
    );
    await expect(listProjects()).rejects.toThrow("Authentication required");
  });

  it("fileUrl passes through path strings and nullish to null", () => {
    expect(fileUrl("/api/files/projects/a_thumb.png")).toBe(
      "/api/files/projects/a_thumb.png",
    );
    expect(fileUrl(null)).toBeNull();
    expect(fileUrl(undefined)).toBeNull();
    expect(fileUrl("")).toBeNull();
  });
});
