const path = require("node:path");
const fs = require("node:fs");

const { loadEnvLocal } = require("./loadEnvLocal.cjs");

loadEnvLocal();

const monorepoRoot = path.join(__dirname, "../..");
const candidates = [
  path.join(monorepoRoot, "site", ".next", "standalone", "site", "server.js"),
  path.join(monorepoRoot, "site", ".next", "standalone", "server.js"),
  path.join(monorepoRoot, ".next", "standalone", "site", "server.js"),
  path.join(monorepoRoot, ".next", "standalone", "server.js"),
];

const server = candidates.find((p) => fs.existsSync(p));
if (!server) {
  console.error(
    "[startStandalone] No standalone server.js found. Run: pnpm run build",
  );
  process.exit(1);
}

require(server);
