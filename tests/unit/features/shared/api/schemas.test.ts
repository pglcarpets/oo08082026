/**
 * Name-mirror coverage for features/shared/api/schemas.
 * Focus: schemas lightly covered elsewhere (customer query, flags, filter, theme, sketch unions).
 */

import { describe, expect, it } from "vitest";
import {
  ActivateThemeSchema,
  AuditEventSchema,
  ConfiguratorActiveToggleSchema,
  ConfiguratorProductBodySchema,
  CustomerQuerySchema,
  FeatureFlagsPatchSchema,
  FilterRankSchema,
  GenerateAltSchema,
  NavSearchSchema,
  PatchCustomerQuerySchema,
  PlannerAdvisorRequestSchema,
  PublishThemeSchema,
  SketchToPlanRequestSchema,
  SketchToPlanRouteErrorSchema,
  SketchToPlanRouteResponseSchema,
  SmartWizardSchema,
  TrackingSchema,
  positiveInt,
} from "@/features/shared/api/schemas";

describe("positiveInt", () => {
  it("coerces positive integer strings", () => {
    expect(positiveInt.parse("7")).toBe(7);
    expect(positiveInt.safeParse("0").success).toBe(false);
    expect(positiveInt.safeParse("-3").success).toBe(false);
  });
});

describe("CustomerQuerySchema", () => {
  it("accepts email-only contact and trims fields", () => {
    const parsed = CustomerQuerySchema.parse({
      name: "  Ada  ",
      email: " ada@example.com ",
      message: "  Need desks  ",
    });
    expect(parsed.name).toBe("Ada");
    expect(parsed.email).toBe("ada@example.com");
    expect(parsed.message).toBe("Need desks");
  });

  it("accepts phone-only contact", () => {
    const parsed = CustomerQuerySchema.parse({
      name: "Bob",
      phone: "+91 99999",
      message: "Call me",
    });
    expect(parsed.phone).toBe("+91 99999");
  });

  it("rejects when neither email nor phone is present", () => {
    const result = CustomerQuerySchema.safeParse({
      name: "No Contact",
      message: "Hello",
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.some((i) => i.message.includes("email or phone"))).toBe(
      true,
    );
  });
});

describe("PatchCustomerQuerySchema", () => {
  it("requires id, status, and followUpChannel", () => {
    const ok = PatchCustomerQuerySchema.parse({
      id: "cq-1",
      status: "in_progress",
      followUpChannel: "whatsapp",
      followUpNotes: "pinged",
    });
    expect(ok.status).toBe("in_progress");
    expect(
      PatchCustomerQuerySchema.safeParse({
        id: "cq-1",
        status: "bogus",
        followUpChannel: "email",
      }).success,
    ).toBe(false);
  });
});

describe("FeatureFlagsPatchSchema", () => {
  it("accepts key-only or non-empty updates map", () => {
    expect(FeatureFlagsPatchSchema.parse({ key: "beta" }).key).toBe("beta");
    expect(
      FeatureFlagsPatchSchema.parse({ updates: { beta: true } }).updates,
    ).toEqual({ beta: true });
  });

  it("rejects empty patch with no key and no updates", () => {
    const empty = FeatureFlagsPatchSchema.safeParse({});
    expect(empty.success).toBe(false);
    const emptyUpdates = FeatureFlagsPatchSchema.safeParse({ updates: {} });
    expect(emptyUpdates.success).toBe(false);
  });
});

describe("FilterRankSchema", () => {
  it("requires productIds and rankBy", () => {
    const ok = FilterRankSchema.parse({
      productIds: ["p1", "p2"],
      rankBy: "price",
      category: " seating ",
    });
    expect(ok.productIds).toEqual(["p1", "p2"]);
    expect(ok.category).toBe("seating");
    expect(
      FilterRankSchema.safeParse({ productIds: [], rankBy: "price" }).success,
    ).toBe(false);
    expect(
      FilterRankSchema.safeParse({ productIds: ["p1"], rankBy: "unknown" })
        .success,
    ).toBe(false);
  });
});

describe("theme schemas", () => {
  it("validates activate and publish theme bodies", () => {
    expect(ActivateThemeSchema.parse({ presetId: " bronze " }).presetId).toBe(
      "bronze",
    );
    const published = PublishThemeSchema.parse({
      themeName: "Ocean-01",
      tokens: { "--color-primary": "#123" },
    });
    expect(published.themeName).toBe("Ocean-01");
    expect(
      PublishThemeSchema.safeParse({
        themeName: "-bad",
        tokens: {},
      }).success,
    ).toBe(false);
  });
});

describe("ConfiguratorProductBodySchema", () => {
  it("requires sizing_type enum and trims name/category", () => {
    const ok = ConfiguratorProductBodySchema.parse({
      name: "  Desk  ",
      category: " Tables ",
      sizing_type: "parametric",
      materials: [" oak ", "steel"],
    });
    expect(ok.name).toBe("Desk");
    expect(ok.category).toBe("Tables");
    expect(ok.materials).toEqual(["oak", "steel"]);
    expect(
      ConfiguratorProductBodySchema.safeParse({
        name: "X",
        category: "Y",
        sizing_type: "freeform",
      }).success,
    ).toBe(false);
  });

  it("toggles active flag only", () => {
    expect(ConfiguratorActiveToggleSchema.parse({ active: false }).active).toBe(
      false,
    );
    expect(ConfiguratorActiveToggleSchema.safeParse({}).success).toBe(false);
  });
});

describe("AI / planner request schemas", () => {
  it("validates planner advisor messages", () => {
    const ok = PlannerAdvisorRequestSchema.parse({
      mode: "chat",
      messages: [{ role: "user", content: " layout tips " }],
    });
    expect(ok.messages[0]?.content).toBe("layout tips");
    expect(
      PlannerAdvisorRequestSchema.safeParse({ messages: [] }).success,
    ).toBe(false);
  });

  it("rejects sketch imageDataUrl that is not a supported data URL", () => {
    const bad = SketchToPlanRequestSchema.safeParse({
      imageDataUrl: "https://example.com/x.png",
      fileName: "x.png",
      prompt: "walls",
    });
    expect(bad.success).toBe(false);

    const good = SketchToPlanRequestSchema.parse({
      imageDataUrl: "data:image/webp;base64,abc",
      fileName: "sketch.webp",
      prompt: "rooms",
    });
    expect(good.includeRooms).toBe(true);
  });
});

describe("SketchToPlan route response unions", () => {
  it("accepts preview and fallback success envelopes", () => {
    const preview = SketchToPlanRouteResponseSchema.parse({
      success: true,
      status: "preview",
      fileName: "a.png",
      objects: [
        { type: "wall", x1: 0, y1: 0, x2: 10, y2: 0 },
        {
          type: "room",
          left: 0,
          top: 0,
          width: 100,
          height: 80,
          label: "Office",
        },
      ],
    });
    expect(preview.status).toBe("preview");
    if (preview.status === "preview") {
      expect(preview.warnings).toEqual([]);
      expect(preview.objects).toHaveLength(2);
    }

    const fallback = SketchToPlanRouteResponseSchema.parse({
      success: true,
      status: "fallback",
      fileName: "a.png",
      reason: "low_confidence",
      message: "Could not extract walls reliably",
    });
    expect(fallback.status).toBe("fallback");
  });

  it("accepts error envelope with optional recovery details", () => {
    const err = SketchToPlanRouteErrorSchema.parse({
      success: false,
      error: {
        code: "SKETCH_FAILED",
        message: "Provider down",
        details: { reason: "missing_provider", fileName: "x.png" },
      },
    });
    expect(err.error.details?.reason).toBe("missing_provider");
  });
});

describe("misc request schemas", () => {
  it("validates audit, tracking, nav search, alt, wizard", () => {
    expect(
      AuditEventSchema.parse({
        team_id: "t1",
        action: "view",
        target_type: "plan",
        target_id: null,
      }).target_id,
    ).toBeNull();

    expect(TrackingSchema.parse({ productId: "p1" }).productId).toBe("p1");

    expect(NavSearchSchema.parse({ query: " desk " }).query).toBe("desk");

    expect(
      GenerateAltSchema.parse({ category: "chairs", name: "Task" }).name,
    ).toBe("Task");

    const wizard = SmartWizardSchema.parse({
      templateId: "open",
      roomWidthMm: 4000,
      roomLengthMm: 5000,
      roomType: "open-plan",
    });
    expect(wizard.roomWidthMm).toBe(4000);
    expect(
      SmartWizardSchema.safeParse({
        templateId: "open",
        roomWidthMm: -1,
        roomLengthMm: 1,
      }).success,
    ).toBe(false);
  });
});
