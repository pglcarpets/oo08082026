"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  SharedClient as Client,
  SharedProject as Project,
  SharedCrmQuoteItem as QuoteItem,
  SharedCrmQuote as Quote,
} from "../../shared/crm/types";

export type { Client, Project, QuoteItem, Quote };

import {
  CRM_DEMO_CLIENTS,
  CRM_DEMO_PROJECTS,
  CRM_DEMO_QUOTES,
  isCrmDemoModeEnabled,
} from "./crmDemoSeed";
import {
  buildCrmSnapshot,
  parseCrmSnapshot,
  type CrmSnapshot,
} from "../crmMetrics";

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface CrmStore {
  clients: Client[];
  projects: Project[];
  quotes: Quote[];

  addClient: (client: Omit<Client, "id" | "createdAt">) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  addProject: (
    project: Omit<Project, "id" | "createdAt" | "updatedAt" | "planIds">,
  ) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  assignPlanToProject: (projectId: string, planId: string) => void;
  removePlanFromProject: (projectId: string, planId: string) => void;

  addQuote: (quote: Omit<Quote, "id" | "createdAt" | "updatedAt">) => Quote;
  updateQuote: (id: string, updates: Partial<Quote>) => void;
  deleteQuote: (id: string) => void;

  /** Replace workspace with packaged sample data (any env). */
  seedDemoData: () => void;
  clearAll: () => void;
  exportSnapshot: () => CrmSnapshot;
  importSnapshot: (raw: unknown) => boolean;
}

export const useCrmStore = create<CrmStore>()(
  persist(
    (set, get) => ({
      clients: isCrmDemoModeEnabled() ? CRM_DEMO_CLIENTS : [],
      projects: isCrmDemoModeEnabled() ? CRM_DEMO_PROJECTS : [],
      quotes: isCrmDemoModeEnabled() ? CRM_DEMO_QUOTES : [],

      addClient: (data) => {
        const client: Client = {
          ...data,
          id: newId("client"),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ clients: [...state.clients, client] }));
        return client;
      },
      updateClient: (id, updates) => {
        set((state) => ({
          clients: state.clients.map((c) =>
            c.id === id ? { ...c, ...updates } : c,
          ),
        }));
      },
      deleteClient: (id) => {
        set((state) => ({
          clients: state.clients.filter((c) => c.id !== id),
          projects: state.projects.map((p) =>
            p.clientId === id ? { ...p, clientId: "none" } : p,
          ),
          quotes: state.quotes.map((q) =>
            q.clientId === id ? { ...q, clientId: "none" } : q,
          ),
        }));
      },

      addProject: (data) => {
        const project: Project = {
          ...data,
          id: newId("project"),
          planIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ projects: [...state.projects, project] }));
        return project;
      },
      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id
              ? { ...p, ...updates, updatedAt: new Date().toISOString() }
              : p,
          ),
        }));
      },
      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          quotes: state.quotes.filter((q) => q.projectId !== id),
        }));
      },
      assignPlanToProject: (projectId, planId) => {
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) {return p;}
            if (p.planIds.includes(planId)) {return p;}
            return {
              ...p,
              planIds: [...p.planIds, planId],
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },
      removePlanFromProject: (projectId, planId) => {
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) {return p;}
            return {
              ...p,
              planIds: p.planIds.filter((pid) => pid !== planId),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      addQuote: (data) => {
        const quote: Quote = {
          ...data,
          id: newId("quote"),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ quotes: [...state.quotes, quote] }));
        return quote;
      },
      updateQuote: (id, updates) => {
        set((state) => ({
          quotes: state.quotes.map((q) =>
            q.id === id
              ? { ...q, ...updates, updatedAt: new Date().toISOString() }
              : q,
          ),
        }));
      },
      deleteQuote: (id) => {
        set((state) => ({
          quotes: state.quotes.filter((q) => q.id !== id),
        }));
      },

      seedDemoData: () => {
        const stamp = new Date().toISOString();
        set({
          clients: CRM_DEMO_CLIENTS.map((c) => ({ ...c, createdAt: stamp })),
          projects: CRM_DEMO_PROJECTS.map((p) => ({
            ...p,
            createdAt: stamp,
            updatedAt: stamp,
          })),
          quotes: CRM_DEMO_QUOTES.map((q) => ({
            ...q,
            createdAt: stamp,
            updatedAt: stamp,
          })),
        });
      },
      clearAll: () => {
        set({ clients: [], projects: [], quotes: [] });
      },
      exportSnapshot: () => {
        const { clients, projects, quotes } = get();
        return buildCrmSnapshot(clients, projects, quotes);
      },
      importSnapshot: (raw) => {
        const snapshot = parseCrmSnapshot(raw);
        if (!snapshot) {return false;}
        set({
          clients: snapshot.clients,
          projects: snapshot.projects,
          quotes: snapshot.quotes,
        });
        return true;
      },
    }),
    {
      name: "oando-crm-storage",
    },
  ),
);
