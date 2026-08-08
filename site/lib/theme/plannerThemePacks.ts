/**
 * Planner material theme packs (woods / metals / fabrics / lighting).
 *
 * Scope: planner block/material tokens only — not site chrome or admin shell.
 * Values mirror lib/catalog/styles/tokens-*.css + theme-*.css semantic maps.
 */

export type PlannerTokenCategory = "woods" | "metals" | "fabrics" | "lighting";

export type PlannerThemePack = {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  tokens: Record<string, string>;
};

/** Category key prefixes used to filter token tables in the admin editor. */
export const PLANNER_TOKEN_CATEGORY_PREFIXES: Record<
  PlannerTokenCategory,
  readonly string[]
> = {
  woods: ["block-wood-", "block-theme-ws-surface", "block-theme-ws-edge"],
  metals: [
    "block-metal-",
    "block-theme-ws-leg-metal",
    "block-theme-sofa-leg-metal",
    "block-theme-chair-frame",
    "block-theme-chair-base-metal",
    "block-theme-chair-caster",
  ],
  fabrics: [
    "block-fabric-",
    "block-theme-ws-panel-fabric",
    "block-theme-sofa-cushion-base",
    "block-theme-sofa-seam",
    "block-theme-chair-mesh",
  ],
  lighting: [
    "block-light-",
    "block-shadow-",
    "block-theme-ws-bevel",
    "block-theme-ws-ao",
    "block-theme-sofa-cushion-shadow",
    "block-theme-drop-shadow",
  ],
};

const WOOD_TOKENS: Record<string, string> = {
  "block-wood-ash-base": "var(--color-ecru-300)",
  "block-wood-ash-grain": "var(--color-ecru-400)",
  "block-wood-ash-edge": "var(--color-ecru-500)",
  "block-wood-ash-shadow": "var(--color-bronze-400)",
  "block-wood-oak-base": "var(--color-ecru-500)",
  "block-wood-oak-grain": "var(--color-ecru-600)",
  "block-wood-oak-edge": "var(--color-ecru-600)",
  "block-wood-oak-shadow": "var(--color-ecru-700)",
  "block-wood-walnut-base": "var(--color-ecru-800)",
  "block-wood-walnut-grain": "var(--color-ecru-900)",
  "block-wood-walnut-edge": "var(--color-ecru-900)",
  "block-wood-walnut-shadow": "var(--color-ecru-950)",
};

const METAL_TOKENS: Record<string, string> = {
  "block-metal-powder-white": "var(--text-inverse)",
  "block-metal-powder-silver": "var(--text-inverse-muted)",
  "block-metal-powder-charcoal": "var(--text-heading-soft)",
  "block-metal-powder-black": "var(--color-dark-midnight-blue-750)",
  "block-metal-chrome-base": "var(--text-inverse-body)",
  "block-metal-chrome-highlight": "var(--color-white-50)",
  "block-metal-chrome-shadow": "var(--text-inverse-subtle)",
  "block-metal-chrome-edge": "var(--text-subtle)",
  "block-metal-brass-base": "#d4af37",
  "block-metal-brass-highlight": "var(--color-ecru-300)",
  "block-metal-brass-shadow": "#aa8620",
};

const FABRIC_TOKENS: Record<string, string> = {
  "block-fabric-mesh-black": "var(--text-body)",
  "block-fabric-mesh-grey": "var(--text-subtle)",
  "block-fabric-mesh-blue": "var(--color-ocean-boat-blue-700)",
  "block-fabric-weave-stone": "var(--color-bronze-300)",
  "block-fabric-weave-sand": "var(--color-bronze-200)",
  "block-fabric-weave-charcoal": "var(--color-bronze-800)",
  "block-fabric-weave-navy": "var(--color-dark-midnight-blue-550)",
  "block-fabric-leather-tan": "#b45309",
  "block-fabric-leather-black": "var(--color-ecru-950)",
};

const LIGHTING_TOKENS: Record<string, string> = {
  "block-light-ao-soft": "var(--scrim-black-20)",
  "block-light-ao-medium": "var(--scrim-black-20)",
  "block-light-ao-hard": "var(--hero-btn-secondary-shadow)",
  "block-light-specular-soft": "var(--glass-white-20)",
  "block-light-specular-sharp": "var(--overlay-panel-72)",
  "block-shadow-color-light": "var(--overlay-inverse-12)",
  "block-shadow-color-heavy": "var(--shadow-tint-pdp-28)",
};

/** Premium light semantic maps — ash wood / light metal / stone fabric. */
const PREMIUM_LIGHT_SEMANTIC: Record<string, string> = {
  "block-theme-ws-surface-base": "var(--block-wood-ash-base)",
  "block-theme-ws-surface-grain": "var(--block-wood-ash-grain)",
  "block-theme-ws-edge-banding": "var(--block-wood-ash-edge)",
  "block-theme-ws-leg-metal": "var(--block-metal-powder-white)",
  "block-theme-ws-panel-fabric": "var(--block-fabric-weave-stone)",
  "block-theme-ws-bevel-highlight": "var(--block-light-specular-soft)",
  "block-theme-ws-ao-shadow": "var(--block-light-ao-soft)",
  "block-theme-sofa-cushion-base": "var(--block-fabric-weave-sand)",
  "block-theme-sofa-cushion-shadow": "var(--block-light-ao-medium)",
  "block-theme-sofa-seam-thread": "var(--block-fabric-weave-charcoal)",
  "block-theme-sofa-leg-metal": "var(--block-metal-chrome-base)",
  "block-theme-chair-mesh": "var(--block-fabric-mesh-black)",
  "block-theme-chair-frame": "var(--block-metal-powder-charcoal)",
  "block-theme-chair-base-metal": "var(--block-metal-chrome-base)",
  "block-theme-chair-caster": "var(--block-metal-powder-black)",
  "block-theme-drop-shadow": "var(--block-shadow-color-light)",
};

/** Executive dark semantic maps — walnut / dark metal / navy fabric. */
const EXECUTIVE_DARK_SEMANTIC: Record<string, string> = {
  "block-theme-ws-surface-base": "var(--block-wood-walnut-base)",
  "block-theme-ws-surface-grain": "var(--block-wood-walnut-grain)",
  "block-theme-ws-edge-banding": "var(--block-wood-walnut-edge)",
  "block-theme-ws-leg-metal": "var(--block-metal-powder-black)",
  "block-theme-ws-panel-fabric": "var(--block-fabric-weave-navy)",
  "block-theme-ws-bevel-highlight": "var(--block-light-specular-sharp)",
  "block-theme-ws-ao-shadow": "var(--block-light-ao-hard)",
  "block-theme-sofa-cushion-base": "var(--block-fabric-leather-black)",
  "block-theme-sofa-cushion-shadow": "var(--block-light-ao-hard)",
  "block-theme-sofa-seam-thread": "var(--block-fabric-leather-tan)",
  "block-theme-sofa-leg-metal": "var(--block-metal-powder-charcoal)",
  "block-theme-chair-mesh": "var(--block-fabric-mesh-grey)",
  "block-theme-chair-frame": "var(--block-metal-powder-charcoal)",
  "block-theme-chair-base-metal": "var(--block-metal-powder-black)",
  "block-theme-chair-caster": "var(--block-metal-powder-charcoal)",
  "block-theme-drop-shadow": "var(--block-shadow-color-heavy)",
};

function packTokens(
  semantic: Record<string, string>,
): Record<string, string> {
  return {
    ...WOOD_TOKENS,
    ...METAL_TOKENS,
    ...FABRIC_TOKENS,
    ...LIGHTING_TOKENS,
    ...semantic,
  };
}

/**
 * Built-in planner packs. Served when `block_themes` is empty/unavailable so
 * the admin theme manager is never a hollow empty shell.
 */
export const PLANNER_THEME_PACKS: readonly PlannerThemePack[] = [
  {
    id: "starter-premium-light",
    name: "premium-light",
    description:
      "Warm ash wood, light powder metal, stone weave — default planner materials.",
    is_active: true,
    tokens: packTokens(PREMIUM_LIGHT_SEMANTIC),
  },
  {
    id: "starter-executive-dark",
    name: "executive-dark",
    description:
      "Walnut wood, dark powder metal, navy weave — executive planner materials.",
    is_active: false,
    tokens: packTokens(EXECUTIVE_DARK_SEMANTIC),
  },
] as const;

export function getPlannerThemePackByName(
  name: string,
): PlannerThemePack | undefined {
  const key = name.trim().toLowerCase();
  return PLANNER_THEME_PACKS.find((p) => p.name.toLowerCase() === key);
}

export function getDefaultPlannerThemePack(): PlannerThemePack {
  return PLANNER_THEME_PACKS[0];
}

export function tokensForCategory(
  tokens: Record<string, string>,
  category: PlannerTokenCategory,
): Array<{ key: string; value: string }> {
  const prefixes = PLANNER_TOKEN_CATEGORY_PREFIXES[category];
  return Object.entries(tokens)
    .filter(([key]) => {
      const normalized = key.replace(/^--/, "");
      return prefixes.some((prefix) => normalized.startsWith(prefix));
    })
    .map(([key, value]) => ({ key: key.replace(/^--/, ""), value }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

export function countTokensByCategory(
  tokens: Record<string, string>,
): Record<PlannerTokenCategory, number> {
  return {
    woods: tokensForCategory(tokens, "woods").length,
    metals: tokensForCategory(tokens, "metals").length,
    fabrics: tokensForCategory(tokens, "fabrics").length,
    lighting: tokensForCategory(tokens, "lighting").length,
  };
}
