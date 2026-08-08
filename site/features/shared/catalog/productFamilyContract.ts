/**
 * Admin Phase 3 — configurable product family contract.
 *
 * Shared by Admin authoring and Planner selection.
 * Pure functions only. No catalog I/O. No pricing (Phase 4).
 *
 * ADM-FAM-01 — options/compatibility in plain language with precise errors.
 * ADM-FAM-02 — one configuration previews matching 2D, 3D, and BOQ identity.
 */

import { z } from "zod";

export const PRODUCT_FAMILY_SCHEMA_VERSION = 1 as const;

const IdSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z][a-z0-9_-]*$/i, "id must be alphanumeric with -/_");

const SlugSchema = z
  .string()
  .regex(/^[a-z][a-z0-9-]{1,63}$/, "slug must match ^[a-z][a-z0-9-]{1,63}$");

const LabelSchema = z.string().trim().min(1).max(160);

const FootprintMmSchema = z
  .object({
    width: z.number().finite().positive(),
    depth: z.number().finite().positive(),
    height: z.number().finite().positive().optional(),
  })
  .strict();

export const FamilyOptionV1Schema = z
  .object({
    optionId: IdSchema,
    /** Human-facing label (Admin form + error text). */
    label: LabelSchema,
    /** Stable commercial line identity for BOQ. */
    boqIdentity: z.string().trim().min(1).max(160),
    /** Optional 2D footprint contribution (typically the size option). */
    footprintMm: FootprintMmSchema.optional(),
    /** Optional 3D mesh / part key for this option. */
    meshKey: z.string().trim().min(1).max(160).optional(),
    /** BOQ quantity when this option is selected (default 1). */
    boqQuantity: z.number().int().positive().default(1),
  })
  .strict();

export type FamilyOptionV1 = z.infer<typeof FamilyOptionV1Schema>;

export const FamilyOptionGroupV1Schema = z
  .object({
    groupId: IdSchema,
    label: LabelSchema,
    /** single = one option; multi = zero or more within min/max. */
    selection: z.enum(["single", "multi"]),
    requirement: z.enum(["required", "optional"]),
    /** Inclusive bounds for multi (and optional single min 0/1). */
    minSelect: z.number().int().min(0).default(0),
    maxSelect: z.number().int().min(1).default(1),
    options: z.array(FamilyOptionV1Schema).min(1),
  })
  .strict()
  .superRefine((group, ctx) => {
    if (group.minSelect > group.maxSelect) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["minSelect"],
        message: "minSelect cannot exceed maxSelect",
      });
    }
    if (group.selection === "single" && group.maxSelect !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxSelect"],
        message: "single-choice groups must have maxSelect = 1",
      });
    }
    if (group.requirement === "required" && group.minSelect < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["minSelect"],
        message: "required groups need minSelect >= 1",
      });
    }
    if (group.requirement === "optional" && group.minSelect !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["minSelect"],
        message: "optional groups need minSelect = 0",
      });
    }
    const ids = group.options.map((o) => o.optionId);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["options"],
        message: "option IDs must be unique within a group",
      });
    }
  });

export type FamilyOptionGroupV1 = z.infer<typeof FamilyOptionGroupV1Schema>;

/**
 * Compatibility rule versioned with the family release.
 * - excludes: if all of `whenOptionIds` are selected, forbid any of `thenOptionIds`
 * - requires: if all of `whenOptionIds` are selected, require all of `thenOptionIds`
 */
export const FamilyCompatibilityRuleV1Schema = z
  .object({
    ruleId: IdSchema,
    kind: z.enum(["excludes", "requires"]),
    whenOptionIds: z.array(IdSchema).min(1),
    thenOptionIds: z.array(IdSchema).min(1),
    /** Plain-language reason shown to Admin / customer. */
    message: z.string().trim().min(1).max(280),
  })
  .strict();

export type FamilyCompatibilityRuleV1 = z.infer<
  typeof FamilyCompatibilityRuleV1Schema
>;

export const ProductFamilyVersionV1Schema = z
  .object({
    /** Immutable once released. */
    versionId: IdSchema,
    status: z.enum(["draft", "released"]),
    optionGroups: z.array(FamilyOptionGroupV1Schema).min(1),
    compatibilityRules: z.array(FamilyCompatibilityRuleV1Schema).default([]),
  })
  .strict()
  .superRefine((version, ctx) => {
    const allOptionIds = version.optionGroups.flatMap((g) =>
      g.options.map((o) => o.optionId),
    );
    if (new Set(allOptionIds).size !== allOptionIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["optionGroups"],
        message: "option IDs must be unique across the whole family version",
      });
    }
    const optionSet = new Set(allOptionIds);
    for (const [index, rule] of version.compatibilityRules.entries()) {
      for (const id of [...rule.whenOptionIds, ...rule.thenOptionIds]) {
        if (!optionSet.has(id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["compatibilityRules", index],
            message: `compatibility rule references unknown option "${id}"`,
          });
        }
      }
    }
  });

export type ProductFamilyVersionV1 = z.infer<typeof ProductFamilyVersionV1Schema>;

export const ProductFamilyV1Schema = z
  .object({
    schemaVersion: z.literal(PRODUCT_FAMILY_SCHEMA_VERSION),
    /** Stable family identity (never reminted on edit). */
    familyId: z.string().uuid(),
    familySlug: SlugSchema,
    name: LabelSchema,
    /** Currently released version id, or null if none released. */
    activeVersionId: IdSchema.nullable(),
    versions: z.array(ProductFamilyVersionV1Schema).min(1),
  })
  .strict()
  .superRefine((family, ctx) => {
    const versionIds = family.versions.map((v) => v.versionId);
    if (new Set(versionIds).size !== versionIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["versions"],
        message: "version IDs must be unique within a family",
      });
    }
    if (
      family.activeVersionId !== null &&
      !versionIds.includes(family.activeVersionId)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["activeVersionId"],
        message: "activeVersionId must reference a version in this family",
      });
    }
  });

export type ProductFamilyV1 = z.infer<typeof ProductFamilyV1Schema>;

export function parseProductFamilyV1(input: unknown): ProductFamilyV1 {
  return ProductFamilyV1Schema.parse(input);
}

export function getFamilyVersion(
  family: ProductFamilyV1,
  versionId: string,
): ProductFamilyVersionV1 | null {
  return family.versions.find((v) => v.versionId === versionId) ?? null;
}

export type FamilyConfigError = {
  readonly code: string;
  /** Plain-language message for Admin / customer (ADM-FAM-01). */
  readonly message: string;
  readonly groupId?: string;
  readonly groupLabel?: string;
  readonly ruleId?: string;
  readonly optionIds?: readonly string[];
  /** Human labels for optionIds (same order). */
  readonly optionLabels?: readonly string[];
};

export type FamilyConfigValidation =
  | { readonly ok: true }
  | { readonly ok: false; readonly errors: readonly FamilyConfigError[] };

function indexOptions(
  version: ProductFamilyVersionV1,
): Map<string, { option: FamilyOptionV1; group: FamilyOptionGroupV1 }> {
  const map = new Map<
    string,
    { option: FamilyOptionV1; group: FamilyOptionGroupV1 }
  >();
  for (const group of version.optionGroups) {
    for (const option of group.options) {
      map.set(option.optionId, { option, group });
    }
  }
  return map;
}

function labelsFor(
  version: ProductFamilyVersionV1,
  optionIds: readonly string[],
): string[] {
  const index = indexOptions(version);
  return optionIds.map((id) => index.get(id)?.option.label ?? id);
}

function selectedInGroup(
  group: FamilyOptionGroupV1,
  selected: ReadonlySet<string>,
): string[] {
  return group.options
    .map((o) => o.optionId)
    .filter((id) => selected.has(id));
}

/**
 * Validate a selection against group rules and compatibility rules.
 * Errors use group/option labels (plain language), not bare machine IDs only.
 * Does not silently default missing choices.
 */
export function validateFamilyConfiguration(
  version: ProductFamilyVersionV1,
  selectedOptionIds: readonly string[],
): FamilyConfigValidation {
  const selected = new Set(selectedOptionIds);
  const errors: FamilyConfigError[] = [];
  const index = indexOptions(version);
  const known = new Set(index.keys());

  for (const id of selectedOptionIds) {
    if (!known.has(id)) {
      errors.push({
        code: "unknown_option",
        message: `“${id}” is not an option in this family version.`,
        optionIds: [id],
        optionLabels: [id],
      });
    }
  }

  for (const group of version.optionGroups) {
    const picks = selectedInGroup(group, selected);
    const pickLabels = labelsFor(version, picks);
    if (picks.length < group.minSelect) {
      errors.push({
        code: "group_under_min",
        groupId: group.groupId,
        groupLabel: group.label,
        message:
          group.requirement === "required"
            ? `Choose ${group.minSelect === 1 ? "one option" : `${group.minSelect} options`} for “${group.label}”.`
            : `“${group.label}” needs at least ${group.minSelect} selection(s).`,
        optionIds: picks,
        optionLabels: pickLabels,
      });
    }
    if (picks.length > group.maxSelect) {
      errors.push({
        code: "group_over_max",
        groupId: group.groupId,
        groupLabel: group.label,
        message:
          group.selection === "single"
            ? `“${group.label}” allows only one choice (you selected: ${pickLabels.join(", ") || "none"}).`
            : `“${group.label}” allows at most ${group.maxSelect} selection(s) (you selected: ${pickLabels.join(", ")}).`,
        optionIds: picks,
        optionLabels: pickLabels,
      });
    }
  }

  for (const rule of version.compatibilityRules) {
    const whenHit = rule.whenOptionIds.every((id) => selected.has(id));
    if (!whenHit) {continue;}
    if (rule.kind === "excludes") {
      const forbidden = rule.thenOptionIds.filter((id) => selected.has(id));
      if (forbidden.length > 0) {
        const whenLabels = labelsFor(version, rule.whenOptionIds);
        const thenLabels = labelsFor(version, forbidden);
        errors.push({
          code: "compatibility_excludes",
          ruleId: rule.ruleId,
          message: rule.message,
          optionIds: forbidden,
          optionLabels: thenLabels,
          // Precise detail after plain rule message
          groupLabel: `Incompatible: ${whenLabels.join(" + ")} with ${thenLabels.join(", ")}`,
        });
      }
    } else {
      const missing = rule.thenOptionIds.filter((id) => !selected.has(id));
      if (missing.length > 0) {
        const whenLabels = labelsFor(version, rule.whenOptionIds);
        const needLabels = labelsFor(version, missing);
        errors.push({
          code: "compatibility_requires",
          ruleId: rule.ruleId,
          message: rule.message,
          optionIds: missing,
          optionLabels: needLabels,
          groupLabel: `Required with ${whenLabels.join(" + ")}: ${needLabels.join(", ")}`,
        });
      }
    }
  }

  if (errors.length > 0) {return { ok: false, errors };}
  return { ok: true };
}

/** ADM-FAM-01 — single string per error for UI lists (message + precise labels). */
export function formatFamilyConfigError(error: FamilyConfigError): string {
  if (
    error.groupLabel &&
    (error.code === "compatibility_excludes" ||
      error.code === "compatibility_requires")
  ) {
    return `${error.message} (${error.groupLabel})`;
  }
  return error.message;
}

export type FamilyBoqLine = {
  readonly optionId: string;
  readonly label: string;
  readonly boqIdentity: string;
  readonly quantity: number;
};

/**
 * ADM-FAM-02 — preview for one configuration before release.
 * 2D footprint, 3D mesh/part keys, and BOQ lines share the same selection set.
 */
export type FamilyConfigurationPreview = {
  readonly familyId: string;
  readonly familySlug: string;
  readonly versionId: string;
  readonly selectedOptionIds: readonly string[];
  /** Plain-language selected option labels (Admin-facing). */
  readonly selectedLabels: readonly string[];
  readonly identity2d: {
    readonly widthMm: number;
    readonly depthMm: number;
    readonly heightMm: number | null;
    readonly symbolKey: string;
  };
  readonly identity3d: {
    readonly meshKeys: readonly string[];
    readonly primaryMeshKey: string;
  };
  readonly identityBoq: {
    readonly lines: readonly FamilyBoqLine[];
    readonly lineIdentities: readonly string[];
  };
  /**
   * True when 2D, 3D, and BOQ all derive from the same validated selection
   * (selection fingerprint match).
   */
  readonly matchingIdentities: true;
  readonly selectionFingerprint: string;
};

export type FamilyConfigurationPreviewResult =
  | { readonly ok: true; readonly preview: FamilyConfigurationPreview }
  | {
      readonly ok: false;
      readonly errors: readonly FamilyConfigError[];
      readonly formattedErrors: readonly string[];
    };

function selectionFingerprint(selectedOptionIds: readonly string[]): string {
  return [...selectedOptionIds].sort().join("|");
}

/**
 * Build 2D / 3D / BOQ identity preview for one configuration (ADM-FAM-02).
 * Fails closed with ADM-FAM-01 errors when the selection is invalid.
 */
export function previewFamilyConfiguration(
  family: ProductFamilyV1,
  versionId: string,
  selectedOptionIds: readonly string[],
): FamilyConfigurationPreviewResult {
  const version = getFamilyVersion(family, versionId);
  if (!version) {
    const err: FamilyConfigError = {
      code: "unknown_version",
      message: `Family version “${versionId}” was not found.`,
    };
    return {
      ok: false,
      errors: [err],
      formattedErrors: [formatFamilyConfigError(err)],
    };
  }

  const validation = validateFamilyConfiguration(version, selectedOptionIds);
  if (!validation.ok) {
    return {
      ok: false,
      errors: validation.errors,
      formattedErrors: validation.errors.map(formatFamilyConfigError),
    };
  }

  const index = indexOptions(version);
  const selected = selectedOptionIds
    .map((id) => index.get(id)?.option)
    .filter((o): o is FamilyOptionV1 => o !== undefined);

  const sizeOption =
    selected.find((o) => o.footprintMm !== undefined) ?? selected[0];
  const footprint = sizeOption?.footprintMm ?? {
    width: 600,
    depth: 600,
    height: undefined,
  };

  const meshKeys = selected
    .map((o) => o.meshKey)
    .filter((k): k is string => typeof k === "string" && k.length > 0);
  const primaryMeshKey =
    meshKeys[0] ??
    `${family.familySlug}-${versionId}-${selectionFingerprint(selectedOptionIds)}`;

  const lines: FamilyBoqLine[] = selected.map((o) => ({
    optionId: o.optionId,
    label: o.label,
    boqIdentity: o.boqIdentity,
    quantity: o.boqQuantity,
  }));

  const fingerprint = selectionFingerprint(selectedOptionIds);
  const symbolKey = `${family.familySlug}:${versionId}:${fingerprint}`;

  return {
    ok: true,
    preview: {
      familyId: family.familyId,
      familySlug: family.familySlug,
      versionId,
      selectedOptionIds: [...selectedOptionIds],
      selectedLabels: selected.map((o) => o.label),
      identity2d: {
        widthMm: footprint.width,
        depthMm: footprint.depth,
        heightMm: footprint.height ?? null,
        symbolKey,
      },
      identity3d: {
        meshKeys,
        primaryMeshKey,
      },
      identityBoq: {
        lines,
        lineIdentities: lines.map((l) => l.boqIdentity),
      },
      matchingIdentities: true,
      selectionFingerprint: fingerprint,
    },
  };
}

/** Form-path draft for Admin authoring (not persisted here). */
export type ProductFamilyFormDraft = {
  readonly familyId: string;
  readonly familySlug: string;
  readonly name: string;
  readonly versionId: string;
  readonly optionGroups: readonly FamilyOptionGroupV1[];
  readonly compatibilityRules: readonly FamilyCompatibilityRuleV1[];
};

export function buildDraftFamilyFromForm(
  draft: ProductFamilyFormDraft,
): ProductFamilyV1 {
  return parseProductFamilyV1({
    schemaVersion: PRODUCT_FAMILY_SCHEMA_VERSION,
    familyId: draft.familyId,
    familySlug: draft.familySlug,
    name: draft.name,
    activeVersionId: null,
    versions: [
      {
        versionId: draft.versionId,
        status: "draft",
        optionGroups: draft.optionGroups,
        compatibilityRules: draft.compatibilityRules,
      },
    ],
  });
}

/** Isolated fixture for tests — no disk/DB. */
export const PRODUCT_FAMILY_V1_FIXTURE = parseProductFamilyV1({
  schemaVersion: 1,
  familyId: "b2c3d4e5-f6a7-4890-b123-456789abcdef",
  familySlug: "linear-desk-family",
  name: "Linear desk family",
  activeVersionId: "v1",
  versions: [
    {
      versionId: "v1",
      status: "released",
      optionGroups: [
        {
          groupId: "size",
          label: "Desk size",
          selection: "single",
          requirement: "required",
          minSelect: 1,
          maxSelect: 1,
          options: [
            {
              optionId: "size-1200",
              label: "1200 × 600 mm",
              boqIdentity: "DSK-1200",
              footprintMm: { width: 1200, depth: 600, height: 750 },
              meshKey: "desk-top-1200",
            },
            {
              optionId: "size-1600",
              label: "1600 × 600 mm",
              boqIdentity: "DSK-1600",
              footprintMm: { width: 1600, depth: 600, height: 750 },
              meshKey: "desk-top-1600",
            },
          ],
        },
        {
          groupId: "finish",
          label: "Finish",
          selection: "single",
          requirement: "required",
          minSelect: 1,
          maxSelect: 1,
          options: [
            {
              optionId: "finish-oak",
              label: "Oak",
              boqIdentity: "FIN-OAK",
              meshKey: "finish-oak",
            },
            {
              optionId: "finish-white",
              label: "White",
              boqIdentity: "FIN-WHT",
              meshKey: "finish-white",
            },
          ],
        },
        {
          groupId: "accessories",
          label: "Accessories",
          selection: "multi",
          requirement: "optional",
          minSelect: 0,
          maxSelect: 2,
          options: [
            {
              optionId: "acc-panel",
              label: "Privacy panel",
              boqIdentity: "ACC-PANEL",
              meshKey: "acc-privacy-panel",
            },
            {
              optionId: "acc-pedestal",
              label: "Pedestal",
              boqIdentity: "ACC-PED",
              meshKey: "acc-pedestal",
            },
            {
              optionId: "acc-monitor",
              label: "Monitor arm",
              boqIdentity: "ACC-MON",
              meshKey: "acc-monitor-arm",
            },
          ],
        },
      ],
      compatibilityRules: [
        {
          ruleId: "no-panel-with-monitor",
          kind: "excludes",
          whenOptionIds: ["acc-panel"],
          thenOptionIds: ["acc-monitor"],
          message:
            "Privacy panel cannot be combined with a monitor arm on this family.",
        },
        {
          ruleId: "pedestal-needs-1600",
          kind: "requires",
          whenOptionIds: ["acc-pedestal"],
          thenOptionIds: ["size-1600"],
          message: "Pedestal storage requires the 1600 mm desk size.",
        },
      ],
    },
  ],
});
