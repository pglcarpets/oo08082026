// @vitest-environment node
import { describe, it, expect } from "vitest";
import { getTableName, isTable } from "drizzle-orm";
import {
  profiles,
  plans,
  teams,
  teamMembers,
  invites,
  priceBooks,
  priceBookVersions,
  auditEvents,
  reviewLinks,
  reviewComments,
} from "@/platform/drizzle/schema/planner";

describe("platform/drizzle/schema/planner", () => {
  const expectedTables: Array<{ table: unknown; name: string }> = [
    { table: profiles, name: "profiles" },
    { table: plans, name: "oando_plans" },
    { table: teams, name: "teams" },
    { table: teamMembers, name: "team_members" },
    { table: invites, name: "invites" },
    { table: priceBooks, name: "price_books" },
    { table: priceBookVersions, name: "price_book_versions" },
    { table: auditEvents, name: "audit_events" },
    { table: reviewLinks, name: "review_links" },
    { table: reviewComments, name: "review_comments" },
  ];

  it("exports pgTable symbols for planner/admin tables", () => {
    for (const { table, name } of expectedTables) {
      expect(isTable(table), name).toBe(true);
      expect(getTableName(table as Parameters<typeof getTableName>[0])).toBe(name);
    }
  });

  it("plans table maps to oando_plans with user linkage", () => {
    expect(getTableName(plans)).toBe("oando_plans");
    expect(plans.userId).toBeDefined();
    expect(plans.payload).toBeDefined();
    expect(plans.status).toBeDefined();
  });

  it("audit_events exposes actor and action columns", () => {
    expect(auditEvents.teamId).toBeDefined();
    expect(auditEvents.actorId).toBeDefined();
    expect(auditEvents.action).toBeDefined();
  });
});
