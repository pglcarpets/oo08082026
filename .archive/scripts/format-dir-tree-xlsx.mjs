import fs from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";

const repoRoot = process.cwd();
const csvPath = path.join(repoRoot, "results", "project-tree.csv");
const xlsxPath = path.join(repoRoot, "results", "repo-dir-tree.xlsx");

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current);
  return cells;
}

const lines = fs.readFileSync(csvPath, "utf8").trim().split(/\r?\n/);
const headers = parseCsvLine(lines[0]);
const rows = lines.slice(1).map(parseCsvLine);

const wb = new ExcelJS.Workbook();
wb.creator = "oando-platform";
wb.created = new Date();

const summary = wb.addWorksheet("Summary");
summary.columns = [
  { header: "Field", key: "field", width: 28 },
  { header: "Value", key: "value", width: 60 },
];
[
  ["Repository", repoRoot],
  ["Generated", new Date().toISOString()],
  ["Total nodes", String(rows.length)],
  ["Directories", String(rows.filter((r) => r[8]?.endsWith("directory") || Object.values(r.slice(0, 8)).some((v) => String(v).endsWith("/"))).length)],
  ["Files", String(rows.filter((r) => !Object.values(r.slice(0, 8)).some((v) => String(v).endsWith("/")) && r[0]).length)],
  ["Source", "scripts/generate-tree.js"],
  ["Notes", "Excludes node_modules, .git, .next, archive, results, test-results, .vscode, public"],
].forEach(([field, value]) => summary.addRow({ field, value }));
summary.getRow(1).font = { bold: true };
summary.views = [{ state: "frozen", ySplit: 1 }];

const tree = wb.addWorksheet("Directory Tree");
tree.columns = [
  { header: "Level 1", key: "l1", width: 18 },
  { header: "Level 2", key: "l2", width: 22 },
  { header: "Level 3", key: "l3", width: 22 },
  { header: "Level 4", key: "l4", width: 22 },
  { header: "Level 5", key: "l5", width: 22 },
  { header: "Level 6", key: "l6", width: 22 },
  { header: "Level 7", key: "l7", width: 22 },
  { header: "Level 8", key: "l8", width: 22 },
  { header: "Full Path", key: "path", width: 52 },
  { header: "Type", key: "type", width: 12 },
  { header: "Narration", key: "narration", width: 42 },
  { header: "Remark", key: "remark", width: 18 },
];

for (const row of rows) {
  const parts = row.slice(0, 8).map((v) => String(v || "").trim());
  const fullPath = parts.filter(Boolean).join("/").replace(/\/$/, "");
  const isDir = parts.some((p) => p.endsWith("/")) || row[8]?.includes("directory");
  tree.addRow({
    l1: parts[0] || "",
    l2: parts[1] || "",
    l3: parts[2] || "",
    l4: parts[3] || "",
    l5: parts[4] || "",
    l6: parts[5] || "",
    l7: parts[6] || "",
    l8: parts[7] || "",
    path: fullPath,
    type: isDir ? "directory" : "file",
    narration: row[8] || "",
    remark: row[9] || "",
  });
}

const headerRow = tree.getRow(1);
headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E78" } };
headerRow.alignment = { vertical: "middle" };
tree.autoFilter = { from: "A1", to: `L${rows.length + 1}` };
tree.views = [{ state: "frozen", ySplit: 1, xSplit: 0 }];

for (let i = 2; i <= rows.length + 1; i += 1) {
  const row = tree.getRow(i);
  if (row.getCell("type").value === "directory") {
    row.font = { bold: true };
    row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F6FA" } };
  }
}

await wb.xlsx.writeFile(xlsxPath);
console.log(`Wrote ${xlsxPath} (${rows.length} rows)`);