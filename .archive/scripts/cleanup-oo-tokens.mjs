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

const ALL = [
  "OO",
  "OO_DRAW",
  "OO_SWATCHES",
  "SCALE_PX_PER_MM",
  "OO_FONT_SANS",
  "OO_FONT_SANS_SHORT",
  "transparentChecker",
];

for (const file of files) {
  if (file.includes("ooTokens.ts")) continue;
  let src = fs.readFileSync(file, "utf8");
  if (!src.includes("@/lib/shared/ooTokens")) continue;

  // drop local SCALE_PX_PER_MM = 0.2 shadowing import
  src = src.replace(/\nconst SCALE_PX_PER_MM = 0\.2;\n/, "\n");

  // fontFamily hardcoding
  src = src.replace(/fontFamily: "Inter, sans-serif"/g, "fontFamily: OO_FONT_SANS");
  src = src.replace(/fontFamily: "Inter"/g, "fontFamily: OO_FONT_SANS_SHORT");

  // useFabric background
  src = src.replace(/useFabric\(\{ background: OO\.white50 \}\)/g, "useFabric({ background: OO.canvasBg })");
  src = src.replace(/background \|\| OO\.white50/g, "background || OO.canvasBg");

  // OO_DRAW for stroke/fill defaults in props panels
  src = src.replace(/px\.stroke \|\| OO\.ink900/g, "px.stroke || OO_DRAW.stroke");
  src = src.replace(/px\.fill \|\| OO\.ecru100/g, "px.fill || OO_DRAW.fill");
  src = src.replace(/propObj\?\.__props\?\.fill \|\| OO\.ecru100/g, "propObj?.__props?.fill || OO_DRAW.fill");
  src = src.replace(/propObj\?\.__props\?\.stroke \|\| OO\.ink900/g, "propObj?.__props?.stroke || OO_DRAW.stroke");

  // guide stroke in useCanvasCore
  src = src.replace(/stroke: OO\.bronze400/g, "stroke: OO_DRAW.guide");

  // trim import to used symbols only
  src = src.replace(
    /import \{([^}]+)\} from "@\/lib\/shared\/ooTokens";/,
    (_m, names) => {
      const used = ALL.filter((n) => {
        const re = new RegExp(`\\b${n}\\b`);
        // count occurrences beyond the import line
        const withoutImport = src.replace(/import \{[^}]+\} from "@\/lib\/shared\/ooTokens";/, "");
        return re.test(withoutImport);
      });
      if (used.length === 0) return "";
      return `import { ${used.join(", ")} } from "@/lib/shared/ooTokens";`;
    },
  );

  // if font tokens used but OO not - ensure fonts in import already handled

  fs.writeFileSync(file, src);
  console.log("cleaned", file);
}
