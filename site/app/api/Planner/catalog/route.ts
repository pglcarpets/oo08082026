import { NextResponse } from "next/server";
import { listCatalog } from "@planner/server/plannerStore";
import { withAuth } from "@/features/shared/api/withAuth";

/**
 * Read-only furniture catalog for the Floor Planner rail.
 *
 * Same on-disk library the Studio writes to, served by the Planner's own
 * handler — the Planner never calls a Studio route. Writes live exclusively on
 * `/api/Studio/furniture`.
 */
export const GET = withAuth(
  async (request) => {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const q = searchParams.get("q");

    let items = await listCatalog();

    if (category && category !== "all") {
      items = items.filter((i) => i.category === category);
    }
    if (q) {
      const needle = q.toLowerCase().trim();
      items = items.filter((i) => {
        const name = String(i.name || "").toLowerCase();
        const tags = Array.isArray(i.tags) ? i.tags.join(" ").toLowerCase() : "";
        return name.includes(needle) || tags.includes(needle);
      });
    }
    return NextResponse.json(items);
  },
  {
    role: "guest",
    rateLimitScope: "planner-catalog:get",
    rateLimit: 60,
  },
);
