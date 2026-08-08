import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/features/crm/stores/crmDemoSeed", async (importOriginal) => {
  const seed = await importOriginal<Record<string, unknown>>();
  return {
    ...seed,
    isCrmDemoModeEnabled: () => true,
  };
});

import { useCrmStore } from "@/features/crm/stores/crmStore";

describe("useCrmStore Zustand Store", () => {
  const defaultState = JSON.parse(JSON.stringify(useCrmStore.getState()));

  beforeEach(() => {
    useCrmStore.setState(JSON.parse(JSON.stringify(defaultState)));
  });

  it("has initial default clients, projects, and quotes", () => {
    const state = useCrmStore.getState();
    expect(state.clients).toHaveLength(2);
    expect(state.projects).toHaveLength(2);
    expect(state.quotes).toHaveLength(1);

    expect(state.clients[0].name).toBe("Amit Sharma");
    expect(state.projects[0].name).toBe("Nexus HQ Floor 4 Layout");
    expect(state.quotes[0].title).toBe("Nexus Phase 1 Workspace Quote");
  });

  describe("Client Actions", () => {
    it("adds a new client", () => {
      const store = useCrmStore.getState();
      const newClient = store.addClient({
        name: "John Doe",
        company: "JD Corp",
        email: "john@jd.com",
        phone: "12345",
        address: "St 12",
        notes: "Likes wood desks",
      });

      expect(newClient.id).toContain("client-");
      expect(newClient.createdAt).toBeDefined();

      const updatedState = useCrmStore.getState();
      expect(updatedState.clients).toHaveLength(3);
      expect(updatedState.clients.find((c) => c.id === newClient.id)).toBeDefined();
    });

    it("updates client fields", () => {
      const store = useCrmStore.getState();
      store.updateClient("client-1", { name: "Amit Kumar Sharma", company: "Nexus Tech" });

      const updatedState = useCrmStore.getState();
      const client = updatedState.clients.find((c) => c.id === "client-1");
      expect(client?.name).toBe("Amit Kumar Sharma");
      expect(client?.company).toBe("Nexus Tech");
    });

    it("deletes client and sets associated projects and quotes clientId to none", () => {
      const store = useCrmStore.getState();
      store.deleteClient("client-1");

      const updatedState = useCrmStore.getState();
      expect(updatedState.clients).toHaveLength(1);
      expect(updatedState.clients.find((c) => c.id === "client-1")).toBeUndefined();

      const project = updatedState.projects.find((p) => p.id === "project-1");
      expect(project?.clientId).toBe("none");

      const quote = updatedState.quotes.find((q) => q.id === "quote-1");
      expect(quote?.clientId).toBe("none");
    });
  });

  describe("Project Actions", () => {
    it("adds, updates and deletes projects", () => {
      const store = useCrmStore.getState();
      const newProj = store.addProject({
        name: "Project Gamma",
        clientId: "client-2",
        status: "on_hold",
        notes: "Brief notes",
      });

      expect(newProj.id).toContain("project-");
      expect(newProj.planIds).toEqual([]);

      let state = useCrmStore.getState();
      expect(state.projects).toHaveLength(3);

      store.updateProject(newProj.id, { status: "completed" });
      state = useCrmStore.getState();
      const project = state.projects.find((p) => p.id === newProj.id);
      expect(project?.status).toBe("completed");

      store.deleteProject("project-1");
      state = useCrmStore.getState();
      expect(state.projects).toHaveLength(2);
      expect(state.quotes).toHaveLength(0);
    });

    it("links and unlinks planIds to/from project", () => {
      const store = useCrmStore.getState();

      store.assignPlanToProject("project-1", "plan-abc");
      let project = useCrmStore.getState().projects.find((p) => p.id === "project-1");
      expect(project?.planIds).toContain("plan-abc");

      store.assignPlanToProject("project-1", "plan-abc");
      project = useCrmStore.getState().projects.find((p) => p.id === "project-1");
      expect(project?.planIds.filter((id) => id === "plan-abc")).toHaveLength(1);

      store.removePlanFromProject("project-1", "plan-abc");
      project = useCrmStore.getState().projects.find((p) => p.id === "project-1");
      expect(project?.planIds).not.toContain("plan-abc");
    });
  });

  describe("Quote Actions", () => {
    it("adds, updates and deletes quotes", () => {
      const store = useCrmStore.getState();
      const newQuote = store.addQuote({
        title: "Draft Quote Gamma",
        clientId: "client-2",
        projectId: "project-2",
        planId: "plan-xyz",
        items: [],
        totalAmount: 150000,
        status: "draft",
      });

      let state = useCrmStore.getState();
      expect(state.quotes).toHaveLength(2);

      store.updateQuote(newQuote.id, { status: "sent", totalAmount: 160000 });
      state = useCrmStore.getState();
      const quote = state.quotes.find((q) => q.id === newQuote.id);
      expect(quote?.status).toBe("sent");
      expect(quote?.totalAmount).toBe(160000);

      store.deleteQuote(newQuote.id);
      state = useCrmStore.getState();
      expect(state.quotes).toHaveLength(1);
    });
  });

  describe("Workspace bootstrap", () => {
    it("clears all records and reseeds sample data", () => {
      const store = useCrmStore.getState();
      store.clearAll();
      expect(useCrmStore.getState().clients).toHaveLength(0);
      expect(useCrmStore.getState().projects).toHaveLength(0);
      expect(useCrmStore.getState().quotes).toHaveLength(0);

      store.seedDemoData();
      const seeded = useCrmStore.getState();
      expect(seeded.clients).toHaveLength(2);
      expect(seeded.projects).toHaveLength(2);
      expect(seeded.quotes).toHaveLength(1);
    });

    it("exports and imports a version-1 snapshot", () => {
      const store = useCrmStore.getState();
      const snapshot = store.exportSnapshot();
      expect(snapshot.version).toBe(1);
      expect(snapshot.clients).toHaveLength(2);

      store.clearAll();
      expect(useCrmStore.getState().clients).toHaveLength(0);

      expect(store.importSnapshot(snapshot)).toBe(true);
      expect(useCrmStore.getState().clients).toHaveLength(2);
      expect(store.importSnapshot({ version: 99 })).toBe(false);
    });
  });
});

