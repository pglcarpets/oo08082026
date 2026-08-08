/**
 * Name-mirror: features/crm/crmRoutes
 */

import { describe, expect, it } from "vitest";
import {
  CRM_ADMIN_BASE,
  CRM_CLIENTS_PATH,
  CRM_PROJECTS_PATH,
  CRM_QUOTES_PATH,
  crmProjectDetailPath,
} from "@/features/crm/crmRoutes";

describe("crmRoutes", () => {
  it("anchors CRM under the admin console", () => {
    expect(CRM_ADMIN_BASE).toBe("/admin/crm");
    expect(CRM_CLIENTS_PATH).toBe("/admin/crm/clients");
    expect(CRM_PROJECTS_PATH).toBe("/admin/crm/projects");
    expect(CRM_QUOTES_PATH).toBe("/admin/crm/quotes");
  });

  it("builds project detail paths with URI encoding", () => {
    expect(crmProjectDetailPath("proj-1")).toBe("/admin/crm/projects/proj-1");
    expect(crmProjectDetailPath("a/b c")).toBe("/admin/crm/projects/a%2Fb%20c");
  });
});
