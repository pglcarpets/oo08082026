import fs from "node:fs";
import path from "node:path";

const root = "site";
const files = [];
function walk(d) {
  for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === ".next") continue;
      walk(p);
    } else if (/\.(ts|tsx)$/.test(ent.name)) files.push(p);
  }
}
walk(root);

const replacements = [
  ["#EDF4FA", "OO.canvasWindowFill"],
  ["rgba(158, 178, 212, 0.16)", "OO.canvasDoorFill"],
  ["#F2F4F8", "OO.sceneBgHigh"],
  ["#F7F9FC", "OO.sceneBgDraft"],
  ["#EDF1F7", "OO.canvasGridMinor"],
  ["#DAE2EC", "OO.canvasGridMajor"],
  ["#F5F7FA", "OO.white150"],
  ["#C6D3E0", "OO.white400"],
  ["#F3F2EF", "OO.ecru100"],
  ["#EAE7E1", "OO.ecru200"],
  ["#DED2B6", "OO.ecru300"],
  ["#BEAF9A", "OO.bronze300"],
  ["#9D876C", "OO.bronze400"],
  ["#7F6A52", "OO.bronze500"],
  ["#0B1324", "OO.ink900"],
  ["#1F3653", "OO.midnight500"],
  ["#335479", "OO.midnight400"],
  ["#406F99", "OO.obb600"],
  ["#5488B6", "OO.obb500"],
  ["#77A2C9", "OO.obb400"],
  ["#9BBBDA", "OO.obb300"],
  ["#5E8E74", "OO.sustain400"],
  ["#7FAF96", "OO.sustain300"],
  ["#C7A882", "OO.bronzeWarm"],
  ["#972B1A", "OO.error"],
  ["#3F5168", "OO.ink600"],
  ["#FFFFFF", "OO.white50"],
  ["#000000", "OO.colorPickerFallback"],
];

let changed = 0;
for (const file of files) {
  if (file.includes(`ooTokens.ts`) || file.includes(`${path.sep}cn.ts`)) continue;
  if (file.includes("focss")) continue;
  let src = fs.readFileSync(file, "utf8");
  const before = src;
  if (!/#[0-9A-Fa-f]{6}|rgba\(158, 178, 212/.test(src)) continue;

  for (const [from, to] of replacements) {
    src = src.split(from).join(to);
  }
  src = src.replace(/"(OO\.[A-Za-z0-9_]+)"/g, "$1");
  src = src.replace(/'(OO\.[A-Za-z0-9_]+)'/g, "$1");

  if (src === before) continue;

  if (!src.includes("@/lib/shared/ooTokens")) {
    const importLine =
      'import { OO, OO_DRAW, OO_SWATCHES, SCALE_PX_PER_MM, OO_FONT_SANS, OO_FONT_SANS_SHORT, transparentChecker } from "@/lib/shared/ooTokens";\n';
    if (src.startsWith('"use client"') || src.startsWith("'use client'")) {
      const nl = src.indexOf("\n");
      src = src.slice(0, nl + 1) + importLine + src.slice(nl + 1);
    } else {
      src = importLine + src;
    }
  }

  fs.writeFileSync(file, src);
  changed += 1;
  console.log("updated", file);
}
console.log("files changed", changed);
