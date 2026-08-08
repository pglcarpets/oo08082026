const path = require("node:path");
const { createRequire } = require("node:module");

const sitePackageJson = path.join(__dirname, "../..", "package.json");
const siteRequire = createRequire(sitePackageJson);

try {
  const sharp = siteRequire("sharp");
  const versions = sharp.versions ?? {};
  const sharpVersion = versions.sharp ?? "unknown";
  const vipsVersion = versions.vips ?? "unknown";

  process.stdout.write(
    `sharp ok (${sharpVersion})` +
      (vipsVersion !== "unknown" ? ` using libvips ${vipsVersion}` : "") +
      "\n",
  );
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(
    `sharp missing or unusable in site workspace: ${message}\n`,
  );
  process.exit(1);
}
