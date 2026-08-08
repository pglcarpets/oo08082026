import { describe, expect, it } from "vitest";

import {
  getMemberSuiteNavLinks,
  isChooseProductRoute,
  isDashboardRoute,
  isPlannerRoute,
  isPortalRoute,
  memberSuitePlannerProjectHref,
  MEMBER_SUITE_ROUTES,
} from "@/features/shared/shell/memberSuiteRoutes";

describe("memberSuiteRoutes", () => {
  it("exposes canonical member-suite paths", () => {
    expect(MEMBER_SUITE_ROUTES.dashboard).toBe("/dashboard");
    expect(MEMBER_SUITE_ROUTES.plannerCanvas).toBe("/ooplanner");
  });

  it("builds planner project hrefs under the canvas alias tree", () => {
    expect(memberSuitePlannerProjectHref("abc 123")).toBe("/planner/projects/abc%20123");
  });

  it("detects dashboard routes including legacy alias", () => {
    expect(isDashboardRoute("/dashboard")).toBe(true);
    expect(isDashboardRoute("/dashboard/")).toBe(true);
    expect(isDashboardRoute("/oando-planner/dashboard")).toBe(true);
    expect(isDashboardRoute("/portal")).toBe(false);
  });

  it("detects portal and choose-product routes", () => {
    expect(isPortalRoute("/portal")).toBe(true);
    expect(isPortalRoute("/portal/guest")).toBe(true);
    expect(isChooseProductRoute("/choose-product")).toBe(true);
    expect(isChooseProductRoute("/choose-product?mode=guest")).toBe(true);
  });

  it("detects planner routes on canvas alias and live app paths", () => {
    expect(isPlannerRoute("/planner/canvas")).toBe(true);
    expect(isPlannerRoute("/ooplanner")).toBe(true);
    expect(isPlannerRoute("/ooplanner/projects/p1")).toBe(true);
    expect(isPlannerRoute("/planner/projects/p1")).toBe(true);
    expect(isPlannerRoute("/dashboard")).toBe(false);
  });

  it("returns nav links with active predicates", () => {
    const links = getMemberSuiteNavLinks();
    expect(links.map((link) => link.label)).toEqual([
      "Dashboard",
      "Choose Product",
      "Portal",
      "Planner",
    ]);
    expect(links.find((link) => link.label === "Planner")?.href).toBe("/ooplanner");
  });
});
