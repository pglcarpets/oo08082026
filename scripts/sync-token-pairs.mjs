#!/usr/bin/env node
/**
 * Verify paired hex values stay in sync between each app's token authorities.
 *
 * Planner and Studio are fully forked — each owns its own palette.css and its
 * own palette TS module, and they are allowed to diverge from each other. What
 * must never drift is the CSS↔TS pair *within* an app.
 *
 * `site/focss/base/` is left in place as the foundation for the site/admin zone
 * port and is intentionally not paired yet.
 *
 * Usage:
 *   node scripts/sync-token-pairs.mjs
 *   pnpm run scan:tokens
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

/** One entry per forked app zone. */
const ZONES = [
  {
    name: "planner",
    palette: "site/focss/planner/base/palette.css",
    tokens: "site/lib/Planner/plannerPalette.ts",
  },
  {
    name: "studio",
    palette: "site/focss/studio/base/palette.css",
    tokens: "site/lib/Studio/studioPalette.ts",
  },
];

/** CSS custom property → OO key (shared hex; edit both files together). */
const PAIRS = [
  ["--color-white-50", "white50"],
  ["--color-white-100", "white100"],
  ["--color-white-150", "white150"],
  ["--color-white-200", "white200"],
  ["--color-white-250", "white250"],
  ["--color-white-300", "white300"],
  ["--color-white-350", "white350"],
  ["--color-white-400", "white400"],
  ["--color-ecru-50", "ecru50"],
  ["--color-ecru-100", "ecru100"],
  ["--color-ecru-200", "ecru200"],
  ["--color-ecru-300", "ecru300"],
  ["--color-bronze-300", "bronze300"],
  ["--color-bronze-400", "bronze400"],
  ["--color-bronze-500", "bronze500"],
  ["--color-bronze-600", "bronze600"],
  ["--color-obb-300", "obb300"],
  ["--color-obb-400", "obb400"],
  ["--color-obb-500", "obb500"],
  ["--color-obb-550", "obb550"],
  ["--color-obb-600", "obb600"],
  ["--color-midnight-300", "midnight300"],
  ["--color-midnight-400", "midnight400"],
  ["--color-midnight-500", "midnight500"],
  ["--color-midnight-600", "midnight600"],
  ["--color-midnight-700", "midnight700"],
  ["--color-midnight-800", "midnight800"],
  ["--color-midnight-900", "midnight900"],
  ["--color-ink-25", "ink25"],
  ["--color-ink-50", "ink50"],
  ["--color-ink-100", "ink100"],
  ["--color-ink-200", "ink200"],
  ["--color-ink-300", "ink300"],
  ["--color-ink-400", "ink400"],
  ["--color-ink-500", "ink500"],
  ["--color-ink-600", "ink600"],
  ["--color-ink-700", "ink700"],
  ["--color-ink-800", "ink800"],
  ["--color-ink-900", "ink900"],
  ["--color-sustain-300", "sustain300"],
  ["--color-sustain-400", "sustain400"],
  ["--color-bronze-warm", "bronzeWarm"],
  ["--color-error", "error"],
  ["--canvas-grid-minor", "canvasGridMinor"],
  ["--canvas-grid-major", "canvasGridMajor"],
  ["--canvas-window-fill", "canvasWindowFill"],
  ["--scene-bg-draft", "sceneBgDraft"],
  ["--scene-bg-high", "sceneBgHigh"],
];

/** OO keys that must equal another OO key (TS-only aliases). */
const TS_ALIASES = [
  ["canvasBg", "white50"],
  ["canvasSelection", "obb600"],
  ["transparentCheckerLight", "white50"],
];

function normalizeHex(hex) {
  const h = hex.toUpperCase();
  if (h.length === 4) {
    return `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
  }
  return h;
}

function parsePaletteCss(src) {
  /** @type {Map<string, string>} */
  const map = new Map();
  const re = /(--[a-z0-9-]+)\s*:\s*(#[0-9A-Fa-f]{3,8})\b/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    map.set(m[1], normalizeHex(m[2]));
  }
  return map;
}

function parseOoTokens(src) {
  /** @type {Map<string, string>} */
  const map = new Map();
  const re = /^\s*([A-Za-z][A-Za-z0-9]*)\s*:\s*"(#[0-9A-Fa-f]{3,8})"/gm;
  let m;
  while ((m = re.exec(src)) !== null) {
    map.set(m[1], normalizeHex(m[2]));
  }
  return map;
}

/** @type {string[]} */
const errors = [];

for (const zone of ZONES) {
  const palettePath = path.join(ROOT, zone.palette);
  const tokensPath = path.join(ROOT, zone.tokens);

  if (!fs.existsSync(palettePath)) {
    errors.push(`[${zone.name}] missing file: ${zone.palette}`);
    continue;
  }
  if (!fs.existsSync(tokensPath)) {
    errors.push(`[${zone.name}] missing file: ${zone.tokens}`);
    continue;
  }

  const palette = parsePaletteCss(fs.readFileSync(palettePath, "utf8"));
  const oo = parseOoTokens(fs.readFileSync(tokensPath, "utf8"));

  for (const [cssVar, ooKey] of PAIRS) {
    const cssHex = palette.get(cssVar);
    const tsHex = oo.get(ooKey);
    if (!cssHex) {
      errors.push(`[${zone.name}] missing in ${zone.palette}: ${cssVar}`);
      continue;
    }
    if (!tsHex) {
      errors.push(`[${zone.name}] missing in ${zone.tokens}: OO.${ooKey}`);
      continue;
    }
    if (cssHex !== tsHex) {
      errors.push(`[${zone.name}] drift ${cssVar} (${cssHex}) ≠ OO.${ooKey} (${tsHex})`);
    }
  }

  for (const [aliasKey, targetKey] of TS_ALIASES) {
    const aliasHex = oo.get(aliasKey);
    const targetHex = oo.get(targetKey);
    if (!aliasHex || !targetHex) {
      errors.push(`[${zone.name}] missing TS alias: OO.${aliasKey} → OO.${targetKey}`);
      continue;
    }
    if (aliasHex !== targetHex) {
      errors.push(
        `[${zone.name}] drift OO.${aliasKey} (${aliasHex}) ≠ OO.${targetKey} (${targetHex})`,
      );
    }
  }
}

if (errors.length > 0) {
  console.error("Token sync check failed:\n");
  for (const e of errors) console.error(`  • ${e}`);
  console.error("\nEach app's palette.css and palette TS module must be edited together.");
  console.error("The two apps are independent — a fix in one does not propagate to the other.");
  process.exit(1);
}

console.log(
  `Token sync OK (${ZONES.length} zones × ${PAIRS.length} CSS↔TS pairs, ${TS_ALIASES.length} TS aliases).`,
);
