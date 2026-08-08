/**
 * Client path contract for @planner/lib/plannerApi.
 * Locks the target HTTP surface CRM (and other callers) should repoint to:
 *   /api/Planner/projects[/:id]  (case-sensitive Planner segment)
 *   /api/Planner/catalog[+upload]
 *   /api/exports
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const axiosMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  axiosPost: vi.fn(),
  create: vi.fn(),
}));

vi.mock("axios", () => {
  axiosMocks.create.mockReturnValue({
    get: axiosMocks.get,
    post: axiosMocks.post,
    patch: axiosMocks.patch,
    delete: axiosMocks.delete,
  });
  return {
    default: {
      create: axiosMocks.create,
      post: axiosMocks.axiosPost,
    },
  };
});

import {
  api,
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

// Module load already called axios.create once; capture that config before any clear.
const createConfigAtLoad = axiosMocks.create.mock.calls[0]?.[0];

describe("@planner/lib/plannerApi path contract", () => {
  beforeEach(() => {
    // Clear only HTTP verb mocks — do not wipe axios.create module-init history.
    axiosMocks.get.mockReset();
    axiosMocks.post.mockReset();
    axiosMocks.patch.mockReset();
    axiosMocks.delete.mockReset();
    axiosMocks.axiosPost.mockReset();
    axiosMocks.get.mockResolvedValue({ data: [] });
    axiosMocks.post.mockResolvedValue({ data: {} });
    axiosMocks.patch.mockResolvedValue({ data: {} });
    axiosMocks.delete.mockResolvedValue({ data: { ok: true } });
    axiosMocks.axiosPost.mockResolvedValue({ data: {} });
  });

  it("configures axios baseURL /api with JSON content-type", () => {
    expect(createConfigAtLoad).toEqual({
      baseURL: "/api",
      headers: { "Content-Type": "application/json" },
    });
    expect(api).toBeDefined();
  });

  it("lists projects at GET /Planner/projects (relative to /api)", async () => {
    axiosMocks.get.mockResolvedValueOnce({ data: [{ id: "p_1" }] });
    const data = await listProjects();
    expect(axiosMocks.get).toHaveBeenCalledWith("/Planner/projects");
    expect(data).toEqual([{ id: "p_1" }]);
  });

  it("gets a project at GET /Planner/projects/:id", async () => {
    axiosMocks.get.mockResolvedValueOnce({ data: { id: "p_1" } });
    await getProject("p_1");
    expect(axiosMocks.get).toHaveBeenCalledWith("/Planner/projects/p_1");
  });

  it("creates a project at POST /Planner/projects", async () => {
    const payload = { name: "A", canvas_json: {} };
    axiosMocks.post.mockResolvedValueOnce({ data: { id: "p_a_x" } });
    await createProject(payload);
    expect(axiosMocks.post).toHaveBeenCalledWith("/Planner/projects", payload);
  });

  it("updates a project at PATCH /Planner/projects/:id", async () => {
    const payload = { name: "B" };
    await updateProject("p_1", payload);
    expect(axiosMocks.patch).toHaveBeenCalledWith("/Planner/projects/p_1", payload);
  });

  it("deletes a project at DELETE /Planner/projects/:id", async () => {
    await deleteProject("p_1");
    expect(axiosMocks.delete).toHaveBeenCalledWith("/Planner/projects/p_1");
  });

  it("lists furniture catalog at GET /Planner/catalog (never /Studio)", async () => {
    await listFurniture({ category: "desks" });
    expect(axiosMocks.get).toHaveBeenCalledWith("/Planner/catalog", {
      params: { category: "desks" },
    });
    const path = String(axiosMocks.get.mock.calls[0]?.[0] ?? "");
    expect(path).not.toMatch(/Studio/i);
  });

  it("uploads furniture via absolute /api/Planner/catalog/upload", async () => {
    const form = new FormData();
    form.append("name", "Custom");
    await uploadFurniture(form);
    expect(axiosMocks.axiosPost).toHaveBeenCalledWith(
      "/api/Planner/catalog/upload",
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
  });

  it("posts exports at POST /exports (neutral, not Studio)", async () => {
    const payload = { data_url: "data:image/png;base64,xx", format: "png" };
    await createExport(payload);
    expect(axiosMocks.post).toHaveBeenCalledWith("/exports", payload);
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
