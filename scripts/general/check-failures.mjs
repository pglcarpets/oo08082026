import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const text = fs.readFileSync(path.join(root, "Failures.md"), "utf8");
const forbidden = [
  /\bresolved\b/i,
  /\bclosed\b/i,
  /\bpass(?:ed)?\b/i,
  /truth snapshot/i,
  /histor(?:y|ical)/i,
  /\[x\]/i,
];
const violations = text.split(/\r?\n/).flatMap((line, index) =>
  forbidden.some((pattern) => pattern.test(line)) ? [`Failures.md:${index + 1}: ${line.trim()}`] : [],
);

if (violations.length) {
  console.error("check-failures FAIL:\n" + violations.map((item) => `  ${item}`).join("\n"));
  process.exit(1);
}
console.log("check:failures OK");
