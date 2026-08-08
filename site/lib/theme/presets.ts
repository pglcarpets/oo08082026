/**
 * Theme Presets Registry — Phase 12
 *
 * Canonical theme presets that can be selected through the admin theme API.
 * Each preset is a flat key-value map of UI chrome CSS custom properties.
 * Block geometry/material tokens live in lib/catalog/styles — not here.
 */

export type ThemePreset = {
  id: string;
  name: string;
  description: string;
  tokens: Record<string, string>;
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "premium-light",
    name: "Premium Light",
    description: "Warm neutral palette with gold accent — default brand theme.",
    tokens: {
      "block-surface-alt": "var(--color-ecru-50)",
      "block-border": "var(--color-ecru-200)",
      "block-text": "var(--color-ecru-950)",
      "block-text-muted": "var(--color-bronze-700)",
      "block-accent": "var(--color-bronze-400)",
      "block-accent-hover": "var(--color-bronze-500)",
      "block-radius": "0.75rem",
      "block-shadow": "0 0.125rem 0.5rem var(--overlay-inverse-06)",
      "block-font-display": "var(--font-display)",
      "block-font-body": "var(--font-sans)",
    },
  },
  {
    id: "executive-dark",
    name: "Executive Dark",
    description: "Dark surface with muted gold accents — executive/boardroom context.",
    tokens: {
      "block-surface-alt": "var(--color-bronze-900)",
      "block-border": "var(--color-bronze-800)",
      "block-text": "var(--color-ecru-100)",
      "block-text-muted": "var(--color-sustain-300)",
      "block-accent": "var(--color-bronze-400)",
      "block-accent-hover": "var(--color-bronze-500)",
      "block-radius": "0.5rem",
      "block-shadow": "0 2px 0.75rem var(--scrim-black-20)",
      "block-font-display": "var(--font-display)",
      "block-font-body": "var(--font-sans)",
    },
  },
  {
    id: "minimal-white",
    name: "Minimal White",
    description: "Clean white with subtle gray borders — minimal/modern look.",
    tokens: {
      "block-surface-alt": "var(--color-white-100)",
      "block-border": "var(--color-bronze-100)",
      "block-text": "var(--color-dark-midnight-blue-850)",
      "block-text-muted": "var(--color-bronze-400)",
      "block-accent": "var(--color-bronze-900)",
      "block-accent-hover": "var(--color-bronze-700)",
      "block-radius": "0.375rem",
      "block-shadow": "0 0.0625rem 0.25rem var(--overlay-inverse-06)",
      "block-font-display": "var(--font-display)",
      "block-font-body": "var(--font-sans)",
    },
  },
  {
    id: "ocean-blue",
    name: "Ocean Blue",
    description: "Cool blue tones — collaborative/tech-forward environments.",
    tokens: {
      "block-surface-alt": "var(--text-strong)",
      "block-border": "var(--text-inverse-body)",
      "block-text": "var(--color-dark-midnight-blue-750)",
      "block-text-muted": "var(--text-subtle)",
      "block-accent": "#2563eb",
      "block-accent-hover": "#1d4ed8",
      "block-radius": "0.5rem",
      "block-shadow": "0 2px 8px rgba(37,99,235,0.08)",
      "block-font-display": "var(--font-display)",
      "block-font-body": "var(--font-sans)",
    },
  },
  {
    id: "warm-earth",
    name: "Warm Earth",
    description: "Natural earth tones — sustainable/biophilic design contexts.",
    tokens: {
      "block-surface-alt": "var(--color-ecru-100)",
      "block-border": "var(--color-ecru-200)",
      "block-text": "var(--color-ecru-950)",
      "block-text-muted": "var(--color-bronze-500)",
      "block-accent": "#8b6914",
      "block-accent-hover": "#a07a1a",
      "block-radius": "0.625rem",
      "block-shadow": "0 2px 0.375rem rgba(139,105,20,0.08)",
      "block-font-display": "var(--font-display)",
      "block-font-body": "var(--font-sans)",
    },
  },
];

/**
 * Get a theme preset by ID. Returns undefined if not found.
 */
export function getPresetById(id: string): ThemePreset | undefined {
  return THEME_PRESETS.find((p) => p.id === id);
}

/**
 * Get the default (active) preset.
 */
export function getDefaultPreset(): ThemePreset {
  return THEME_PRESETS[0];
}
