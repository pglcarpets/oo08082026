/**
 * Lift planner `project/<tree>/` into `features/planner/<tree>/` and rewire imports.
 *
 * Default mode is dry-run (report only). Pass `--apply` to mutate the tree.
 * Pass `--verify` to assert already-lifted trees have no stale import paths.
 *
 * Usage (from repo root):
 *   node scripts/planner-lift-project-trees.mjs --verify
 *   node scripts/planner-lift-project-trees.mjs --trees store
 *   node scripts/planner-lift-project-trees.mjs --trees store,shared --apply
 *   node scripts/planner-lift-project-trees.mjs --trees catalog --apply --force-test-overwrite
 *
 * Design:
 * - Never invent a third parallel tree; consolidate into the planner root.
 * - Filename collisions require an explicit rename map (see RENAMES).
 * - Name-mirrored unit tests move with the source when the destination is free.
 * - Hollow duplicate tests (destination already has a richer file) are skipped
 *   unless `--force-test-overwrite` is set.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PLANNER = path.join(REPO_ROOT, "site", "features", "planner");
const PROJECT = path.join(PLANNER, "project");
const UNIT_TESTS = path.join(REPO_ROOT, "site", "tests", "unit", "features", "planner");
const UNIT_PROJECT_TESTS = path.join(UNIT_TESTS, "project");

/** Trees already lifted — verify mode checks these by default. */
const LIFTED_TREES = [
  "lib",
  "model",
  "persistence",
  "store",
  "cleanup",
  "catalog",
  "shared",
];

/**
 * Destination rename when the root folder already owns the same basename.
 * Keys are paths relative to `project/<tree>/`.
 */
const RENAMES = Object.freeze({
  persistence: Object.freeze({
    "plannerSession.ts": "open3dSession.ts",
  }),
});

/**
 * Alias / string rewrites applied across `site/` (and optional docs).
 * Order matters: more-specific keys first.
 */
function buildRewrites(trees) {
  const pairs = [];
  for (const tree of trees) {
    const renameMap = RENAMES[tree] ?? {};
    for (const [fromBase, toBase] of Object.entries(renameMap)) {
      const fromStem = fromBase.replace(/\.tsx?$/, "");
      const toStem = toBase.replace(/\.tsx?$/, "");
      pairs.push([
        `@/features/planner/project/${tree}/${fromStem}`,
        `@/features/planner/${tree}/${toStem}`,
      ]);
      pairs.push([
        `features/planner/project/${tree}/${fromStem}`,
        `features/planner/${tree}/${toStem}`,
      ]);
    }
    pairs.push([
      `@/features/planner/project/${tree}/`,
      `@/features/planner/${tree}/`,
    ]);
    pairs.push([
      `features/planner/project/${tree}/`,
      `features/planner/${tree}/`,
    ]);
  }
  return pairs;
}

const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
]);

const SKIP_DIR_NAMES = new Set([
  "node_modules",
  ".git",
  ".next",
  ".turbo",
  "dist",
  "build",
  "coverage",
]);

function parseArgs(argv) {
  const args = {
    apply: false,
    verify: false,
    forceTestOverwrite: false,
    trees: [],
    docs: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--apply") args.apply = true;
    else if (a === "--verify") args.verify = true;
    else if (a === "--force-test-overwrite") args.forceTestOverwrite = true;
    else if (a === "--docs") args.docs = true;
    else if (a === "--trees") {
      const raw = argv[i + 1];
      if (!raw || raw.startsWith("--")) {
        throw new Error("--trees requires a comma-separated list");
      }
      args.trees = raw.split(",").map((t) => t.trim()).filter(Boolean);
      i += 1;
    } else if (a === "--help" || a === "-h") {
      args.help = true;
    } else {
      throw new Error(`Unknown argument: ${a}`);
    }
  }
  return args;
}

function printHelp() {
  console.log(`planner-lift-project-trees.mjs

Lift site/features/planner/project/<tree> → site/features/planner/<tree>
and rewire imports / name-mirrored tests.

Options:
  --trees a,b,c          Trees to lift (default for --verify: ${LIFTED_TREES.join(",")})
  --verify               Assert no stale project/<tree> import paths remain
  --apply                Perform moves + rewrites (otherwise dry-run)
  --force-test-overwrite Overwrite destination tests on name collision
  --docs                 Also rewrite plan/ and docs/ markdown path mentions
  -h, --help             Show this help
`);
}

function walkFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIR_NAMES.has(entry.name)) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(abs, out);
    else out.push(abs);
  }
  return out;
}

function ensureDir(dir, apply) {
  if (fs.existsSync(dir)) return;
  if (apply) fs.mkdirSync(dir, { recursive: true });
}

function relPosix(from, to) {
  return path.relative(from, to).split(path.sep).join("/");
}

function listSourceFiles(tree) {
  const srcRoot = path.join(PROJECT, tree);
  if (!fs.existsSync(srcRoot)) return [];
  return walkFiles(srcRoot).filter((f) => TEXT_EXTENSIONS.has(path.extname(f)) || path.extname(f) === "");
}

function destinationForSource(tree, absSource) {
  const srcRoot = path.join(PROJECT, tree);
  const rel = path.relative(srcRoot, absSource).split(path.sep).join("/");
  const renameMap = RENAMES[tree] ?? {};
  const renamedRel = renameMap[rel] ? renameMap[rel] : rel;
  return {
    rel,
    renamedRel,
    dest: path.join(PLANNER, tree, renamedRel),
  };
}

function planFileMoves(tree) {
  const moves = [];
  for (const src of listSourceFiles(tree)) {
    const { rel, renamedRel, dest } = destinationForSource(tree, src);
    moves.push({
      kind: "source",
      tree,
      src,
      dest,
      rel,
      renamedRel,
      collision: fs.existsSync(dest),
    });
  }
  return moves;
}

function planTestMoves(tree, forceTestOverwrite) {
  const srcRoot = path.join(UNIT_PROJECT_TESTS, tree);
  if (!fs.existsSync(srcRoot)) return [];
  const moves = [];
  const renameMap = RENAMES[tree] ?? {};
  for (const src of walkFiles(srcRoot)) {
    if (!src.endsWith(".test.ts") && !src.endsWith(".test.tsx")) continue;
    const rel = path.relative(srcRoot, src).split(path.sep).join("/");
    // Map plannerSession.test.ts → open3dSession.test.ts when source was renamed.
    let destRel = rel;
    for (const [fromBase, toBase] of Object.entries(renameMap)) {
      const fromTest = fromBase.replace(/\.tsx?$/, ".test.ts");
      const toTest = toBase.replace(/\.tsx?$/, ".test.ts");
      if (rel === fromTest || rel.endsWith(`/${fromTest}`)) {
        destRel = rel.replace(fromTest, toTest);
      }
    }
    const dest = path.join(UNIT_TESTS, tree, destRel);
    const collision = fs.existsSync(dest);
    moves.push({
      kind: "test",
      tree,
      src,
      dest,
      rel,
      renamedRel: destRel,
      collision,
      skip: collision && !forceTestOverwrite,
    });
  }
  return moves;
}

function applyMove(move, apply) {
  if (move.kind === "test" && move.skip) {
    return { status: "skip-hollow", move };
  }
  if (move.collision && move.kind === "source") {
    throw new Error(
      `Collision: ${relPosix(REPO_ROOT, move.dest)} already exists. ` +
        `Add a RENAMES['${move.tree}'] entry for '${move.rel}'.`,
    );
  }
  if (!apply) return { status: "dry-run", move };
  ensureDir(path.dirname(move.dest), true);
  if (move.collision && move.kind === "test" && !move.skip) {
    fs.rmSync(move.dest, { force: true });
  }
  fs.renameSync(move.src, move.dest);
  return { status: "moved", move };
}

function removeEmptyDirs(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) removeEmptyDirs(path.join(dir, entry.name));
  }
  if (fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
}

function rewriteFileContent(content, rewrites) {
  let next = content;
  let hits = 0;
  for (const [from, to] of rewrites) {
    if (!next.includes(from)) continue;
    const parts = next.split(from);
    hits += parts.length - 1;
    next = parts.join(to);
  }
  return { next, hits };
}

function rewriteTree(roots, rewrites, apply) {
  const changed = [];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const file of walkFiles(root)) {
      if (!TEXT_EXTENSIONS.has(path.extname(file))) continue;
      const before = fs.readFileSync(file, "utf8");
      const { next, hits } = rewriteFileContent(before, rewrites);
      if (hits === 0) continue;
      changed.push({ file, hits });
      if (apply) fs.writeFileSync(file, next, "utf8");
    }
  }
  return changed;
}

/** Replace `from "<prefix>shared/` only when prefix is exact (no extra `../`). */
function rewriteSharedImport(text, fromPrefix, toPrefix) {
  // Match from "…shared/ but not from "…/…/shared when fromPrefix is shorter.
  const escaped = fromPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`from "${escaped}shared/`, "g");
  return text.replace(re, `from "${toPrefix}shared/`);
}

/**
 * After a lift, relative imports that pointed at sibling project folders break.
 * Patch known patterns inside newly-lifted files.
 */
function patchLiftedRelativeImports(tree, apply) {
  const destRoot = path.join(PLANNER, tree);
  if (!fs.existsSync(destRoot)) return [];
  const patches = [];
  for (const file of walkFiles(destRoot)) {
    if (!TEXT_EXTENSIONS.has(path.extname(file))) continue;
    let text = fs.readFileSync(file, "utf8");
    const original = text;
    const depth = path
      .relative(destRoot, path.dirname(file))
      .split(path.sep)
      .filter(Boolean).length;

    if (tree === "lib") {
      text = text.replaceAll('from "../../store/', 'from "../../project/store/');
      text = text.replaceAll('from "../../../editor/', 'from "../../editor/');
      text = rewriteSharedImport(text, "../../", "../../project/");
    }
    if (tree === "model") {
      // depth 0 (model/*.ts): ../shared → ../project/shared
      // depth ≥1 (actions|operations): ../../shared → ../../project/shared
      if (depth === 0) {
        text = rewriteSharedImport(text, "../", "../project/");
      } else {
        text = rewriteSharedImport(text, "../../", "../../project/");
        // Fix a mistaken shallow rewrite left by an earlier pass.
        text = text.replace(
          /from "\.\.\/project\/shared\//g,
          'from "../../project/shared/',
        );
      }
    }
    if (tree === "persistence") {
      text = rewriteSharedImport(text, "../", "../project/");
      text = text.replaceAll('from "./plannerSession"', 'from "./open3dSession"');
    }

    if (text === original) continue;
    patches.push(relPosix(REPO_ROOT, file));
    if (apply) fs.writeFileSync(file, text, "utf8");
  }
  return patches;
}

/**
 * After lifting `store`, relatives that still point at `project/store` must
 * retarget the new root `store/` (e.g. lib/commands/plannerCommand.ts).
 */
function patchConsumersAfterStoreLift(apply) {
  const targets = [
    path.join(PLANNER, "lib"),
    path.join(PLANNER, "editor"),
    path.join(PLANNER, "canvas"),
  ];
  const changed = [];
  for (const root of targets) {
    if (!fs.existsSync(root)) continue;
    for (const file of walkFiles(root)) {
      if (!TEXT_EXTENSIONS.has(path.extname(file))) continue;
      let text = fs.readFileSync(file, "utf8");
      const original = text;
      text = text.replaceAll('from "../../project/store/', 'from "../../store/');
      text = text.replaceAll('from "../project/store/', 'from "../store/');
      text = text.replaceAll(
        "@/features/planner/project/store/",
        "@/features/planner/store/",
      );
      if (text === original) continue;
      changed.push(relPosix(REPO_ROOT, file));
      if (apply) fs.writeFileSync(file, text, "utf8");
    }
  }
  return changed;
}

function findStaleRefs(trees, roots) {
  const stale = [];
  const patterns = trees.map((t) => `project/${t}/`);
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const file of walkFiles(root)) {
      if (!TEXT_EXTENSIONS.has(path.extname(file))) continue;
      // Ignore this script and archive noise.
      const rel = relPosix(REPO_ROOT, file);
      if (rel.startsWith("scripts/planner-lift-project-trees.mjs")) continue;
      if (rel.startsWith(".archive/")) continue;
      const text = fs.readFileSync(file, "utf8");
      for (const p of patterns) {
        if (!text.includes(p)) continue;
        // Allow historical mentions in FINISH-PLAN style docs only when not --verify-strict;
        // verify fails on code + tests always.
        const isCode =
          rel.startsWith("site/features/") ||
          rel.startsWith("tests/") ||
          rel.startsWith("site/tests/") ||
          rel.startsWith("site/app/") ||
          rel.startsWith("site/config/") ||
          rel.endsWith("vitest.shared.ts") ||
          rel.endsWith("vitest.config.ts");
        if (!isCode) continue;
        stale.push({ file: rel, pattern: p });
      }
    }
  }
  return stale;
}

function summarizeMoves(moves) {
  const collisions = moves.filter((m) => m.collision && !(m.kind === "test" && m.skip));
  const skips = moves.filter((m) => m.skip);
  return { total: moves.length, collisions: collisions.length, skips: skips.length };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const trees = args.trees.length > 0 ? args.trees : LIFTED_TREES;
  const mode = args.verify ? "verify" : args.apply ? "apply" : "dry-run";

  console.log(`planner-lift-project-trees  mode=${mode}  trees=${trees.join(",")}`);
  console.log(`planner root: ${relPosix(REPO_ROOT, PLANNER)}`);

  if (args.verify) {
    const stale = findStaleRefs(trees, [
      path.join(REPO_ROOT, "site"),
    ]);
    if (stale.length === 0) {
      console.log(`VERIFY PASS: no stale project/{${trees.join(",")}} refs under site/ code+tests`);
      for (const tree of trees) {
        const src = path.join(PROJECT, tree);
        const dest = path.join(PLANNER, tree);
        const srcGone = !fs.existsSync(src);
        const destPresent = fs.existsSync(dest);
        console.log(
          `  ${tree}: project/${tree} ${srcGone ? "absent" : "STILL PRESENT"} · root/${tree} ${destPresent ? "present" : "MISSING"}`,
        );
        if (!srcGone || !destPresent) {
          console.error(`VERIFY FAIL: ${tree} layout incomplete`);
          process.exit(1);
        }
      }
      process.exit(0);
    }
    console.error(`VERIFY FAIL: ${stale.length} stale reference(s)`);
    for (const s of stale.slice(0, 40)) {
      console.error(`  ${s.file}  (${s.pattern})`);
    }
    process.exit(1);
  }

  const allMoves = [];
  for (const tree of trees) {
    if (!fs.existsSync(path.join(PROJECT, tree))) {
      console.log(`skip ${tree}: project/${tree} not present (already lifted?)`);
      continue;
    }
    allMoves.push(...planFileMoves(tree));
    allMoves.push(...planTestMoves(tree, args.forceTestOverwrite));
  }

  const summary = summarizeMoves(allMoves);
  console.log(
    `planned moves: ${summary.total} (source collisions=${allMoves.filter((m) => m.kind === "source" && m.collision).length}, test skips=${summary.skips})`,
  );
  for (const move of allMoves) {
    const tag =
      move.kind === "test" && move.skip
        ? "SKIP-TEST"
        : move.collision
          ? "COLLISION"
          : "MOVE";
    const renameNote =
      move.rel !== move.renamedRel ? `  (rename ${move.rel} → ${move.renamedRel})` : "";
    console.log(
      `  [${tag}] ${relPosix(REPO_ROOT, move.src)} → ${relPosix(REPO_ROOT, move.dest)}${renameNote}`,
    );
  }

  const sourceCollisions = allMoves.filter((m) => m.kind === "source" && m.collision);
  if (sourceCollisions.length > 0) {
    console.error("Abort: resolve source collisions via RENAMES before --apply");
    process.exit(1);
  }

  const rewrites = buildRewrites(trees);
  const rewriteRoots = [path.join(REPO_ROOT, "site")];
  if (args.docs) {
    rewriteRoots.push(path.join(REPO_ROOT, "plan"), path.join(REPO_ROOT, "docs"));
  }

  if (!args.apply) {
    const wouldRewrite = rewriteTree(rewriteRoots, rewrites, false);
    console.log(`dry-run rewrites: ${wouldRewrite.length} file(s) would change`);
    for (const tree of trees) {
      const patches = patchLiftedRelativeImports(tree, false);
      if (patches.length) console.log(`dry-run relative patches (${tree}): ${patches.length}`);
    }
    if (trees.includes("store")) {
      const storeConsumers = patchConsumersAfterStoreLift(false);
      if (storeConsumers.length) {
        console.log(`dry-run store consumer patches: ${storeConsumers.length}`);
      }
    }
    console.log("Re-run with --apply to execute.");
    process.exit(0);
  }

  // Apply moves
  for (const move of allMoves) {
    const result = applyMove(move, true);
    if (result.status === "skip-hollow") {
      // Drop hollow duplicate so project/tests do not keep a second copy.
      fs.rmSync(move.src, { force: true });
      console.log(`  deleted hollow duplicate test ${relPosix(REPO_ROOT, move.src)}`);
    }
  }
  for (const tree of trees) {
    removeEmptyDirs(path.join(PROJECT, tree));
    removeEmptyDirs(path.join(UNIT_PROJECT_TESTS, tree));
  }

  const changed = rewriteTree(rewriteRoots, rewrites, true);
  console.log(`rewrote ${changed.length} file(s)`);

  for (const tree of trees) {
    const patches = patchLiftedRelativeImports(tree, true);
    if (patches.length) {
      console.log(`relative import patches (${tree}): ${patches.length}`);
    }
  }
  if (trees.includes("store")) {
    const storeConsumers = patchConsumersAfterStoreLift(true);
    if (storeConsumers.length) {
      console.log(`store consumer patches: ${storeConsumers.length}`);
    }
  }

  const stale = findStaleRefs(trees, [path.join(REPO_ROOT, "site")]);
  if (stale.length > 0) {
    console.error(`APPLY incomplete: ${stale.length} stale ref(s) remain`);
    for (const s of stale.slice(0, 40)) console.error(`  ${s.file}  (${s.pattern})`);
    process.exit(1);
  }

  console.log("APPLY PASS");
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
