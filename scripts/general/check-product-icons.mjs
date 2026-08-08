/**
 * Fail if lucide-react or next-themes are declared as dependencies, claimed as the
 * shadcn icon library, or imported anywhere under site/**.
 * Also fail if a React Flow UI feature file imports an icon library other than
 * @phosphor-icons/react, or if a Product Studio control uses a text glyph as an
 * icon (R28) — a bare character imports nothing, so the import ban cannot see it.
 * Exit 0 = clean. Exit 1 = violations.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const SCAN_SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  "dist",
  "build",
  "coverage",
]);

const BANNED_IMPORT_PATTERN = /from\s+["'](lucide-react|next-themes)["']/;
const REACT_FLOW_UI_DIR = path.join(
  root,
  "site/features/admin/product-studio/composer/ui",
);
const GLYPH_SCAN_DIR = path.join(root, "site/features/admin/product-studio");
const NON_PHOSPHOR_ICON_IMPORT = /from\s+["'](?!@phosphor-icons\/react)([^"']*icons?[^"']*)["']/i;

/** How far back an accessible name may sit from the character it labels. */
const ACCESSIBLE_NAME_LOOKBACK_LINES = 15;
const ACCESSIBLE_NAME = /aria-label|\btitle=/;
/** Characters that are ordinary code punctuation, never JSX text content. */
const CODE_PUNCTUATION = /[<>{}()[\];,:=`'"\\|&!?~^$#@%+\-*/]/;

/**
 * Returns every place a lone character is the whole visible content of a control
 * that already carries an accessible name — i.e. the character is decorative, i.e.
 * it is being used as an icon.
 */
export function findGlyphIconViolations(source) {
  const lines = source.split(/\r?\n/);
  const violations = [];

  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index];
    const trimmed = raw.trim();

    // Same-line form: <Tag aria-label="…">×</Tag>
    const inline = /(?:^|>)\s*([^\s<>{}])\s*<\//.exec(trimmed);
    if (inline && ACCESSIBLE_NAME.test(trimmed)) {
      violations.push({ line: index + 1, text: inline[1] });
      continue;
    }

    // Own-line form: the character is the only thing on its line.
    if (trimmed.length !== 1) continue;
    if (CODE_PUNCTUATION.test(trimmed)) continue;

    let previous = index - 1;
    while (previous >= 0 && lines[previous].trim().length === 0) previous -= 1;
    if (previous < 0) continue;
    const opener = lines[previous].trim();
    if (!opener.endsWith(">") || opener.endsWith("/>")) continue;

    const window = lines
      .slice(Math.max(0, index - ACCESSIBLE_NAME_LOOKBACK_LINES), index)
      .join("\n");
    if (!ACCESSIBLE_NAME.test(window)) continue;

    violations.push({ line: index + 1, text: trimmed });
  }

  return violations;
}

export function checkProductIcons() {
  const violations = [];

  const packageJson = JSON.parse(
    fs.readFileSync(path.join(root, "package.json"), "utf8"),
  );
  for (const banned of ["lucide-react", "next-themes"]) {
    if (packageJson.dependencies?.[banned]) {
      violations.push(`package.json dependencies must not declare "${banned}"`);
    }
    if (packageJson.devDependencies?.[banned]) {
      violations.push(`package.json devDependencies must not declare "${banned}"`);
    }
  }

  const componentsJsonPath = path.join(root, "components.json");
  if (fs.existsSync(componentsJsonPath)) {
    const componentsJson = JSON.parse(fs.readFileSync(componentsJsonPath, "utf8"));
    if (componentsJson.iconLibrary === "lucide") {
      violations.push('components.json must not claim iconLibrary: "lucide"');
    }
  }

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (SCAN_SKIP_DIRS.has(entry.name)) continue;
        walk(path.join(dir, entry.name));
        continue;
      }
      if (!entry.isFile()) continue;
      if (!/\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) continue;

      const abs = path.join(dir, entry.name);
      const relative = path.relative(root, abs).replace(/\\/g, "/");
      const text = fs.readFileSync(abs, "utf8");

      if (BANNED_IMPORT_PATTERN.test(text)) {
        violations.push(`${relative} imports a banned package (lucide-react/next-themes)`);
      }

      if (abs.startsWith(REACT_FLOW_UI_DIR) && NON_PHOSPHOR_ICON_IMPORT.test(text)) {
        violations.push(
          `${relative} must import icons only from @phosphor-icons/react`,
        );
      }

      if (abs.startsWith(GLYPH_SCAN_DIR) && entry.name.endsWith(".tsx")) {
        for (const { line, text: glyph } of findGlyphIconViolations(text)) {
          violations.push(
            `${relative}:${line} uses the text glyph "${glyph}" as an icon — use a Phosphor icon`,
          );
        }
      }
    }
  }

  walk(path.join(root, "site"));
  return violations;
}

const isCli =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCli) {
  const violations = checkProductIcons();
  if (violations.length > 0) {
    console.error("check-product-icons FAILED:\n");
    for (const v of violations) console.error(`  - ${v}`);
    process.exit(1);
  }
  console.log("check-product-icons OK");
  process.exit(0);
}
