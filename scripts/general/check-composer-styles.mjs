/**
 * Product Studio style coverage (R29).
 *
 * Fails in both directions:
 *   unstyled — a composer class name is rendered but no stylesheet defines it.
 *              Seven toolbar-group containers were in this state, so they fell
 *              back to `display: block` and the zoom buttons rendered as native
 *              browser controls on the canvas.
 *   dead     — a rule exists for a class nothing renders. `.shape-composer__workspace`
 *              and its 48rem three-column media query survived the move to
 *              FlexLayout by months.
 *
 * Only `className` attributes count as usage. `data-testid` values share the same
 * prefix and are not class names.
 *
 * Exit 0 = clean. Exit 1 = violations.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** Class-name families this check owns. */
const OWNED_PREFIXES = ["shape-composer", "product-studio-"];

const SOURCE_DIRS = [
  "site/features/admin/product-studio",
  "site/app/admin",
];
const STYLE_DIR = "site/focss";

function isOwned(token) {
  return OWNED_PREFIXES.some((prefix) => token.startsWith(prefix));
}

function walk(dir, test) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === "node_modules" || entry.name === ".next"
        ? []
        : walk(absolute, test);
    }
    return test(entry.name) ? [absolute] : [];
  });
}

/**
 * Class names from `className` attributes only — both `className="a b"` and
 * `className={cn("a", x && "b")}`.
 */
export function findRenderedClassNames(source) {
  const found = new Set();
  const attribute = /className\s*=\s*/g;
  let match;

  while ((match = attribute.exec(source)) !== null) {
    let index = match.index + match[0].length;
    let value = "";

    if (source[index] === '"' || source[index] === "'") {
      const quote = source[index];
      const end = source.indexOf(quote, index + 1);
      if (end === -1) continue;
      value = source.slice(index + 1, end);
    } else if (source[index] === "{") {
      let depth = 0;
      const start = index;
      do {
        if (source[index] === "{") depth += 1;
        else if (source[index] === "}") depth -= 1;
        index += 1;
      } while (index < source.length && depth > 0);
      // Tokenize the whole expression rather than parsing its literals: a
      // template literal splices `${…}` into the middle of a class name, and a
      // quote-pair regex swallows the interpolation with it.
      value = source.slice(start, index);
    } else {
      continue;
    }

    for (const [token] of value.matchAll(/[A-Za-z0-9_-]+/g)) {
      if (isOwned(token)) found.add(token);
    }
  }

  return found;
}

/** Class names any selector in the stylesheet targets. */
export function findStyledClassNames(css) {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const found = new Set();
  // Selector text is everything before a `{` that is not an at-rule prelude.
  for (const block of withoutComments.split("{")) {
    for (const [, token] of block.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) {
      if (isOwned(token)) found.add(token);
    }
  }
  return found;
}

export function checkComposerStyles() {
  const rendered = new Set();
  for (const dir of SOURCE_DIRS) {
    for (const file of walk(path.join(root, dir), (name) => name.endsWith(".tsx"))) {
      for (const token of findRenderedClassNames(fs.readFileSync(file, "utf8"))) {
        rendered.add(token);
      }
    }
  }

  const styled = new Set();
  for (const file of walk(path.join(root, STYLE_DIR), (name) => name.endsWith(".css"))) {
    for (const token of findStyledClassNames(fs.readFileSync(file, "utf8"))) {
      styled.add(token);
    }
  }

  const unstyled = [...rendered].filter((token) => !styled.has(token)).sort();
  const dead = [...styled].filter((token) => !rendered.has(token)).sort();
  return { unstyled, dead };
}

const isCli =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCli) {
  const { unstyled, dead } = checkComposerStyles();
  if (unstyled.length > 0 || dead.length > 0) {
    console.error("check-composer-styles FAILED:\n");
    for (const token of unstyled) {
      console.error(`  - unstyled: .${token} is rendered but no stylesheet defines it`);
    }
    for (const token of dead) {
      console.error(`  - dead: .${token} has a rule but nothing renders it`);
    }
    process.exit(1);
  }
  console.log("check-composer-styles OK — no unstyled class, no dead rule");
  process.exit(0);
}
