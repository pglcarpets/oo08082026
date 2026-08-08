import fs from "fs";
import path from "path";

const root = process.cwd();
const ignore = new Set([
  "node_modules",
  ".git",
  ".next",
  "public",
  "dist",
  "tests",
  "generated-documents",
]);

/**
 * Patterns that indicate a real secret value (not an empty assignment).
 *
 * The value matcher excludes the backtick deliberately. Prose documenting an
 * empty assignment inside a markdown code span — `` `OPENAI_API_KEY=` `` — would
 * otherwise satisfy `\S+` with the span's own closing backtick and be reported
 * as a leaked key. A real secret written inside a span still matches, because
 * the value characters come before the backtick.
 */
const SECRET_VALUE = String.raw`[^\s\`]+`;
const patterns = [
  /sb_secret_[A-Za-z0-9_-]{10,}/i,
  /sb_publishable_[A-Za-z0-9_-]{10,}/i,
  new RegExp(String.raw`SUPABASE_SERVICE_ROLE_KEY\s*=\s*${SECRET_VALUE}`, "i"),
  new RegExp(String.raw`SUPABASE_ADMIN_SERVICE_ROLE_KEY\s*=\s*${SECRET_VALUE}`, "i"),
  new RegExp(String.raw`NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*${SECRET_VALUE}`, "i"),
  /postgresql:\/\/[\w@:./%$+=-]+/i,
  new RegExp(String.raw`CLOUDFLARE_API_TOKEN\s*=\s*${SECRET_VALUE}`, "i"),
  new RegExp(String.raw`OPENAI_API_KEY\s*=\s*${SECRET_VALUE}`, "i"),
];

/**
 * Local env files are the intended home for secrets (gitignored).
 * Do not flag them; the scan is for accidental commits into tracked sources.
 */
function isLocalEnvFile(file) {
  const base = path.basename(file);
  if (base === ".env" || base === ".env.local") return true;
  // .env.development.local, .env.production.local, etc. — not .env.example
  if (base.startsWith(".env.") && !base.endsWith(".example") && base !== ".env.example") {
    return true;
  }
  return false;
}

function isSafeReferenceOrExample(line) {
  return (
    /\benv\s*\(/i.test(line) ||
    /\b(?:Deno|process)\.env\b/.test(line) ||
    /Format:\s*postgresql:\/\/user:password@/i.test(line) ||
    // Doc placeholders: KEY=... or postgresql://...
    /=\s*\.\.\.\s*$/.test(line) ||
    /postgresql:\/\/\.\.\./i.test(line) ||
    /=\s*<[^>]+>\s*$/.test(line) ||
    /=\s*your[_-]/i.test(line) ||
    /=\s*changeme/i.test(line)
  );
}

function walk(dir) {
  const results = [];
  for (const name of fs.readdirSync(dir)) {
    if (ignore.has(name)) continue;
    const full = path.join(dir, name);
    try {
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        results.push(...walk(full));
      } else if (stat.isFile()) {
        results.push(full);
      }
    } catch {
      // ignore
    }
  }
  return results;
}

function scan() {
  const files = walk(root);
  const hits = [];
  for (const file of files) {
    if (isLocalEnvFile(file)) continue;
    // only scan text files
    if (file.includes(".png") || file.includes(".jpg") || file.includes(".jpeg") || file.includes(".gif") || file.includes(".d.ts")) continue;
    let content;
    try {
      content = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isSafeReferenceOrExample(line)) continue;
      for (const p of patterns) {
        if (p.test(line)) {
          hits.push({ file, line: i + 1, text: line.trim() });
        }
      }
    }
  }

  if (hits.length === 0) {
    console.log("No likely secrets found.");
    return 0;
  }

  console.error(`Found ${hits.length} potential secret(s):`);
  for (const h of hits) {
    console.error(`${h.file}:${h.line}: ${h.text}`);
  }
  console.error("Please remove secrets from the repository and add them to local .env files.");
  return 1;
}

process.exitCode = scan();
