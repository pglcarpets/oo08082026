/**
 * Resolves BLOCK_STYLE CSS variable tokens to concrete colors for SVG raster export.
 * Values match premium-light theme fallbacks in lib/catalog/styles/blocks2d.css.
 */
const TOKEN_COLORS: Record<string, string> = {
  "--block-surface": "var(--color-ecru-300)",
  "--block-surface-grad-end": "var(--color-ecru-400)",
  "--block-surface-stroke": "var(--color-ecru-500)",
  "--block-seat": "var(--text-muted)",
  "--block-seat-stroke": "var(--text-body)",
  "--block-seat-contour": "var(--text-subtle)",
  "--block-seat-backrest": "var(--text-heading-soft)",
  "--block-seat-backrest-stroke": "var(--color-dark-midnight-blue-750)",
  "--block-armrest": "var(--text-body)",
  "--block-armrest-soft": "var(--text-heading-soft)",
  "--block-caster-base": "var(--text-inverse-body)",
  "--block-caster-spoke": "var(--text-inverse-subtle)",
  "--block-caster-wheel": "var(--text-muted)",
  "--block-sofa": "var(--color-bronze-500)",
  "--block-sofa-stroke": "var(--color-bronze-800)",
  "--block-sofa-arm": "var(--color-ecru-800)",
  "--block-sofa-seam": "var(--color-bronze-300)",
  "--block-panel": "var(--text-inverse-subtle)",
  "--block-panel-grad-start": "var(--text-inverse-muted)",
  "--block-screen-grad-start": "var(--text-heading-soft)",
  "--block-screen-grad-end": "var(--color-dark-midnight-blue-750)",
  "--block-shadow-color": "var(--shadow-tint-pdp-22)",
  "--block-storage": "var(--text-inverse-body)",
  "--block-storage-grad-start": "var(--text-strong)",
  "--block-storage-stroke": "var(--text-inverse-subtle)",
  "--block-glyph": "var(--text-inverse-muted)",
  "--block-glyph-dark": "var(--text-muted)",
  "--block-equip-white": "var(--color-white-50)",
  "--block-equip-gray": "var(--text-inverse-body)",
  "--block-equip-dark": "var(--text-subtle)",
  "--block-plant-base": "#65a30d",
  "--block-plant-dark": "#3f6212",
  "--block-plant-outline": "var(--color-ecru-900)",
  "--block-pot-base": "#78350f",
};

function parseCssVariables(css: string): Map<string, string> {
  const vars = new Map<string, string>(Object.entries(TOKEN_COLORS));
  const re = /--([a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(css)) !== null) {
    vars.set(`--${match[1]}`, match[2].trim());
  }
  return vars;
}

function isTerminalToken(name: string): boolean {
  return /^(?:--(?:color|text|shadow|surface|border|glass|hero|panel)-)/i.test(name);
}

function parseVarExpression(value: string): { name: string; fallback?: string } | null {
  const trimmed = value.trim();
  if (!trimmed.toLowerCase().startsWith("var(") || !trimmed.endsWith(")")) {return null;}

  const inner = trimmed.slice(4, -1);
  let depth = 0;
  for (let i = 0; i < inner.length; i += 1) {
    const char = inner[i];
    if (char === "(") {
      depth += 1;
      continue;
    }
    if (char === ")") {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (char === "," && depth === 0) {
      return {
        name: inner.slice(0, i).trim(),
        fallback: inner.slice(i + 1).trim(),
      };
    }
  }

  return { name: inner.trim() };
}

function findClosingParen(input: string, openParenIndex: number): number {
  let depth = 0;
  for (let i = openParenIndex + 1; i < input.length; i += 1) {
    const char = input[i];
    if (char === "(") {
      depth += 1;
      continue;
    }
    if (char === ")") {
      if (depth === 0) {return i;}
      depth -= 1;
    }
  }
  return -1;
}

function resolveInlineVars(value: string, vars: Map<string, string>, depth: number): string {
  let output = "";
  let cursor = 0;

  while (cursor < value.length) {
    const start = value.indexOf("var(", cursor);
    if (start === -1) {
      output += value.slice(cursor);
      break;
    }

    output += value.slice(cursor, start);
    const end = findClosingParen(value, start + 3);
    if (end === -1) {
      output += value.slice(start);
      break;
    }

    output += resolveVarChain(value.slice(start, end + 1), vars, depth + 1);
    cursor = end + 1;
  }

  return output;
}

function resolveVarChain(value: string, vars: Map<string, string>, depth = 0): string {
  if (depth > 24) {return value;}
  const trimmed = value.trim();
  if (/^#([0-9a-f]{3,8})$/i.test(trimmed)) {return trimmed;}
  if (/^rgba?\(/i.test(trimmed)) {return trimmed;}

  const varMatch = parseVarExpression(trimmed);
  if (varMatch) {
    const key = varMatch.name;
    const raw = vars.get(key) ?? TOKEN_COLORS[key];
    if (raw !== undefined) {return resolveVarChain(raw, vars, depth + 1);}
    if (varMatch.fallback) {return resolveVarChain(varMatch.fallback, vars, depth + 1);}
    return isTerminalToken(key) ? `var(${key})` : "var(--text-inverse-subtle)";
  }

  return trimmed.includes("var(") ? resolveInlineVars(trimmed, vars, depth) : trimmed;
}

export type BlockColorResolver = (token: string | undefined) => string;

export function createBlockColorResolver(css?: string): BlockColorResolver {
  const vars = css ? parseCssVariables(css) : new Map(Object.entries(TOKEN_COLORS));
  return (token: string | undefined) => {
    if (!token) {return "none";}
    if (token === "none" || token === "currentColor") {return token;}
    if (/^#([0-9a-f]{3,8})$/i.test(token)) {return token;}
    if (/^rgba?\(/i.test(token)) {return token;}
    return resolveVarChain(token, vars);
  };
}

export function resolveSvgForRaster(svg: string, css: string): string {
  const vars = parseCssVariables(css);
  return resolveInlineVars(svg.replace(/color-mix\([^)]+\)/gi, "var(--color-ecru-200)"), vars, 0);
}
