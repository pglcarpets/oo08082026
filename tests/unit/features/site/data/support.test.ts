/**
 * Name-mirror: features/site/data/support
 */

import { describe, expect, it } from "vitest";
import { SITE_CONTACT } from "@/features/site/data/contact";
import { VISUAL_IVR_TREE } from "@/features/site/data/support";

describe("VISUAL_IVR_TREE", () => {
  it("root menu exposes sales, support, and general branches", () => {
    expect(VISUAL_IVR_TREE.id).toBe("root");
    expect(VISUAL_IVR_TREE.label).toBe("Main Menu");
    expect(VISUAL_IVR_TREE.options).toHaveLength(3);
    const ids = VISUAL_IVR_TREE.options!.map((n) => n.id);
    expect(ids).toEqual(["sales", "support", "general"]);
  });

  it("sales branch includes domestic and international contacts", () => {
    const sales = VISUAL_IVR_TREE.options!.find((n) => n.id === "sales");
    expect(sales?.options).toHaveLength(3);
    const domestic = sales?.options?.find((n) => n.id === "sales_de");
    expect(domestic?.action?.type).toBe("contact");
    expect(domestic?.action?.detail).toContain("@");
  });

  it("contact actions use SITE_CONTACT only — no invented phones or emails", () => {
    const allowedPhones = new Set<string>([
      SITE_CONTACT.salesPhone,
      SITE_CONTACT.supportPhone,
    ]);
    const allowedEmails = new Set<string>([SITE_CONTACT.salesEmail]);

    function walk(node: (typeof VISUAL_IVR_TREE) | NonNullable<(typeof VISUAL_IVR_TREE)["options"]>[number]) {
      if (node.action?.type === "contact") {
        const value = node.action.value;
        if (value.includes("@")) {
          expect(allowedEmails.has(value), value).toBe(true);
        } else {
          expect(allowedPhones.has(value), value).toBe(true);
        }
        if (node.action.detail?.includes("@")) {
          expect(allowedEmails.has(node.action.detail), node.action.detail).toBe(
            true,
          );
        }
      }
      for (const child of node.options ?? []) {
        walk(child);
      }
    }

    walk(VISUAL_IVR_TREE);
  });

  it("support branch includes order status info action", () => {
    const support = VISUAL_IVR_TREE.options!.find((n) => n.id === "support");
    const orderStatus = support?.options?.find((n) => n.id === "order_status");
    expect(orderStatus?.action?.type).toBe("info");
    expect(orderStatus?.action?.value).toMatch(/order confirmation/i);
  });

  it("general branch links careers route", () => {
    const general = VISUAL_IVR_TREE.options!.find((n) => n.id === "general");
    const careers = general?.options?.find((n) => n.id === "careers");
    expect(careers?.action?.type).toBe("link");
    expect(careers?.action?.value).toBe("/career");
  });
});
