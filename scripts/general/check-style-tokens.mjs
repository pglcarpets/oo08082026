/**
 * Token-bypass gate — governance rules C3, C4, C5, C6, C7, C10.
 *
 * Inspects ONLY positions that carry styling:
 *   - the string content of className={...} / className="..."
 *   - the object body of style={{ ... }}
 *   - declaration lines in non-token .css files
 *
 * It deliberately does not grep whole files — a file-wide scan is noisy
 * and reports `const [a, b] = useState()` as a Tailwind arbitrary value; of its
 * 2471 such matches only 381 lines contained a className at all.
 * Prefer `pnpm run check:style-tokens` and `pnpm run lint:ui:strict` for
 * style/token drift (broad hardcode auditors were removed 2026-08-02).
 *
 * Ratchet (governance §7): fails when the count RISES above the recorded
 * baseline, never on the existing debt. Remediation lowers the baseline.
 *
 *   node scripts/general/check-style-tokens.mjs            # gate
 *   node scripts/general/check-style-tokens.mjs --list     # every finding
 *   node scripts/general/check-style-tokens.mjs --update   # re-record baseline
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const BASELINE_FILE = path.join(ROOT, "config/quality/style-token-baseline.json");

const SRC = ["site/app", "site/components", "site/features", "site/lib"];
const CSS_ROOT = "site/focss";

/** Layers that legitimately hold raw values — they define the tokens. */
const TOKEN_LAYERS = [
  "site/app/css/base/",
  "site/app/css/core/locked/",
  "site/focss/tokens/",
  "site/focss/base/",
];

/** C10 — Satori cannot resolve CSS custom properties; literals are required. */
const RENDERER_LITERAL = /(opengraph-image|twitter-image|\bicon)\.tsx$/;

/** C6 — shadcn/Radix state selectors are correct idiom, never a violation. */
const VARIANT_SELECTOR = /^(data|aria|group-data|peer-data|has|group-has|peer-has|supports|not)-\[/;

/** Layout-shape arbitraries have no token equivalent. */
const LAYOUT_ONLY = /(vh|vw|fr|\/|auto|minmax|calc)/;

function walk(dir, test) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") return [];
      return walk(abs, test);
    }
    return test(entry.name) ? [abs] : [];
  });
}

const rel = (p) => path.relative(ROOT, p).replace(/\\/g, "/");

function stylingPositions(text) {
  const out = [];
  let m;

  const classAttr = /className\s*=\s*(\{[^]*?\}|"[^"]*"|'[^']*'|`[^`]*`)/g;
  while ((m = classAttr.exec(text))) {
    const line = text.slice(0, m.index).split("\n").length;
    for (const s of m[1].match(/["'`]([^"'`]*)["'`]/g) || []) {
      out.push({ kind: "class", line, value: s.slice(1, -1) });
    }
  }

  const styleAttr = /style\s*=\s*\{\{([^]*?)\}\}/g;
  while ((m = styleAttr.exec(text))) {
    out.push({ kind: "style", line: text.slice(0, m.index).split("\n").length, value: m[1] });
  }

  return out;
}

const CLASS_RULES = [
  ["C5_arbitrary", /\b[a-z-]+\[[^\]]+\]/g],
  ["C3_raw_hex", /#[0-9a-fA-F]{3,8}\b/g],
  ["C4_px_literal", /\b\d+px\b/g],
];
const STYLE_RULES = [
  ["C3_raw_hex", /#[0-9a-fA-F]{3,8}\b/g],
  ["C4_px_literal", /:\s*["'`]?\d+px/g],
  ["C3_rgb_color", /\brgba?\(/g],
];
const CSS_RULES = [
  ["C3_raw_hex", /#[0-9a-fA-F]{3,8}\b/g],
  ["C3_rgb_color", /\brgba?\([^)]*\)/g],
];

function scan() {
  const findings = [];
  const isToken = (r) => TOKEN_LAYERS.some((t) => r.startsWith(t));

  for (const root of SRC) {
    for (const file of walk(path.join(ROOT, root), (n) => n.endsWith(".tsx"))) {
      const r = rel(file);
      if (isToken(r) || RENDERER_LITERAL.test(r)) continue;
      const text = fs.readFileSync(file, "utf8");
      for (const pos of stylingPositions(text)) {
        for (const [id, re] of pos.kind === "class" ? CLASS_RULES : STYLE_RULES) {
          re.lastIndex = 0;
          let hit;
          while ((hit = re.exec(pos.value))) {
            if (id === "C5_arbitrary" && VARIANT_SELECTOR.test(hit[0])) continue;
            findings.push({
              file: r,
              line: pos.line,
              rule: id,
              value: hit[0].slice(0, 60),
              severity: id.startsWith("C3") ? "HIGH" : LAYOUT_ONLY.test(hit[0]) ? "LOW" : "MEDIUM",
            });
          }
        }
      }
    }
  }

  for (const file of walk(path.join(ROOT, CSS_ROOT), (n) => n.endsWith(".css"))) {
    const r = rel(file);
    if (isToken(r)) continue;
    fs.readFileSync(file, "utf8").split("\n").forEach((ln, i) => {
      if (/^\s*(\/\*|\*)/.test(ln) || !ln.includes(":")) return;
      for (const [id, re] of CSS_RULES) {
        re.lastIndex = 0;
        let hit;
        while ((hit = re.exec(ln))) {
          findings.push({ file: r, line: i + 1, rule: id, value: hit[0].slice(0, 60), severity: "HIGH" });
        }
      }
    });
  }

  return findings;
}

const findings = scan();
const byFile = {};
for (const f of findings) byFile[f.file] = (byFile[f.file] || 0) + 1;

if (process.argv.includes("--list")) {
  for (const f of findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)) {
    console.log(`${f.severity.padEnd(6)} ${f.rule.padEnd(16)} ${f.file}:${f.line}  ${f.value}`);
  }
}

if (process.argv.includes("--update")) {
  fs.mkdirSync(path.dirname(BASELINE_FILE), { recursive: true });
  fs.writeFileSync(
    BASELINE_FILE,
    JSON.stringify({ total: findings.length, perFile: byFile }, null, 1) + "\n",
  );
  console.log(`check:style-tokens baseline recorded — ${findings.length} findings`);
  process.exit(0);
}

if (!fs.existsSync(BASELINE_FILE)) {
  console.error("check:style-tokens FAIL: no baseline. Run with --update to record one.");
  process.exit(1);
}

const baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, "utf8"));

/** Per-file ratchet: a file may not gain findings even if the total falls. */
const risen = Object.entries(byFile)
  .filter(([file, n]) => n > (baseline.perFile[file] || 0))
  .map(([file, n]) => `  ${file}: ${baseline.perFile[file] || 0} -> ${n}`);

if (risen.length) {
  console.error(
    `check:style-tokens FAIL: token bypass increased in ${risen.length} file(s)\n` +
      risen.join("\n") +
      `\n\nTotal ${baseline.total} -> ${findings.length}.` +
      `\nUse a token or a scale step (governance C3-C5). Do not run --update to silence this.`,
  );
  process.exit(1);
}

const delta = findings.length - baseline.total;
console.log(
  `check:style-tokens OK — ${findings.length} findings` +
    (delta < 0 ? ` (${-delta} fewer than baseline; run --update to lower it)` : " (at baseline)"),
);
