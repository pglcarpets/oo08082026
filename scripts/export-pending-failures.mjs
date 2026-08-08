#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "./lib/repoRoot.mjs";

export function defaultPaths(repoRoot = REPO_ROOT) {
  return {
    input: path.join(repoRoot, "Failures.md"),
    indexOutput: path.join(repoRoot, "results", "failures-index.csv"),
    pendingOutput: path.join(repoRoot, "results", "pending-failures.csv"),
  };
}

export function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function cleanField(value) {
  return String(value ?? "").replace(/`/g, "").trim();
}

export function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

export function writeAtomicFile(targetPath, contents, deps = {}) {
  const writeFile = deps.writeFile ?? fs.writeFileSync;
  const rename = deps.rename ?? fs.renameSync;
  const exists = deps.exists ?? fs.existsSync;
  const unlink = deps.unlink ?? fs.unlinkSync;
  const sleepFn = deps.sleep ?? sleep;
  const pid = deps.pid ?? process.pid;

  const dir = path.dirname(targetPath);
  const base = path.basename(targetPath);
  const tempPath = path.join(dir, `${base}.${pid}.tmp`);

  writeFile(tempPath, contents, "utf8");

  let lastError;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      rename(tempPath, targetPath);
      return;
    } catch (error) {
      lastError = error;
      const code = error && typeof error === "object" ? error.code : undefined;
      if (attempt === 5 || !["EBUSY", "EPERM", "EACCES"].includes(code)) {
        break;
      }
      sleepFn(200 * attempt);
    }
  }

  try {
    if (exists(tempPath)) unlink(tempPath);
  } catch {
    // Leave cleanup alone if the temp file is also locked.
  }

  throw lastError;
}

export function resolutionStateFromStatus(status) {
  const text = String(status ?? "").toLowerCase();
  if (text.includes("resolved")) return "resolved";
  if (text.includes("verified structurally")) return "verified";
  if (text.includes("open")) return "open";
  if (text.includes("partial")) return "partial";
  if (text.includes("blocked")) return "blocked";
  if (text.includes("in progress")) return "in-progress";
  return "unknown";
}

export function isPendingState(state) {
  return ["open", "partial", "blocked", "in-progress"].includes(state);
}

export function parseFailuresMarkdown(markdown) {
  const lines = String(markdown ?? "").split(/\r?\n/);
  const items = [];
  let current = null;
  let currentGroup = "";

  function startItem(section) {
    current = {
      section,
      status: "",
      files: "",
      summary: "",
      note: "",
      action: "",
    };
  }

  function flush() {
    if (!current) return;
    const resolutionState = resolutionStateFromStatus(current.status);
    items.push({
      group: currentGroup,
      section: current.section,
      resolution_state: resolutionState,
      pending: isPendingState(resolutionState) ? "yes" : "no",
      status: current.status,
      files: current.files,
      summary: current.summary,
      action: current.action,
      note: current.note,
    });
    current = null;
  }

  for (const line of lines) {
    const groupHeading = line.match(/^##\s+(.*)$/);
    if (groupHeading) {
      flush();
      currentGroup = cleanField(groupHeading[1]);
      continue;
    }

    const heading = line.match(/^###\s+(.*)$/);
    if (heading) {
      flush();
      startItem(cleanField(heading[1]));
      continue;
    }

    if (/^#{1,6}\s+/.test(line)) {
      flush();
      continue;
    }

    const field = line.match(
      /^- \*\*(Status|File|Files|Finding|Description|Note|Action):\*\*\s*(.*)$/,
    );
    if (field) {
      const [, label, value] = field;
      if (!current) startItem(currentGroup);
      if (
        current.section === currentGroup &&
        (label === "File" || label === "Files") &&
        current.status &&
        (current.files || current.summary || current.note || current.action)
      ) {
        flush();
        startItem(currentGroup);
      }
      const key =
        label === "Status"
          ? "status"
          : label === "File" || label === "Files"
            ? "files"
            : label === "Finding" || label === "Description"
              ? "summary"
              : label === "Note"
                ? "note"
                : "action";
      const cleaned = cleanField(value);
      current[key] = current[key] ? `${current[key]} ${cleaned}`.trim() : cleaned;
      continue;
    }

    if (!current) continue;

    if (line.startsWith("- ") && current.status) {
      const cleaned = cleanField(line.slice(2));
      current.note = current.note ? `${current.note} ${cleaned}` : cleaned;
    }
  }

  flush();

  items.sort(
    (a, b) =>
      a.resolution_state.localeCompare(b.resolution_state) ||
      a.group.localeCompare(b.group) ||
      a.section.localeCompare(b.section),
  );

  return items;
}

export function rowsToCsv(items) {
  const header =
    "resolution_state,pending,status,group,section,files,summary,action,note,source";
  const body = items
    .map((item) =>
      [
        item.resolution_state,
        item.pending,
        cleanField(item.status),
        cleanField(item.group),
        cleanField(item.section),
        cleanField(item.files),
        cleanField(item.summary),
        cleanField(item.action),
        cleanField(item.note),
        item.source,
      ]
        .map(csvEscape)
        .join(","),
    )
    .join("\n");
  return `${header}\n${body}\n`;
}

export function exportPendingFailures(options = {}) {
  const repoRoot = options.repoRoot ?? REPO_ROOT;
  const paths = options.paths ?? defaultPaths(repoRoot);
  const readFile = options.readFile ?? fs.readFileSync;
  const mkdir = options.mkdir ?? fs.mkdirSync;
  const writeAtomic = options.writeAtomic ?? writeAtomicFile;
  const log = options.log ?? console.log;

  const markdown = readFile(paths.input, "utf8");
  const items = parseFailuresMarkdown(markdown);
  const indexRows = items.map((item) => ({
    ...item,
    source: "Failures.md",
  }));
  const pendingRows = indexRows.filter((item) => item.pending === "yes");

  mkdir(path.dirname(paths.indexOutput), { recursive: true });
  writeAtomic(paths.indexOutput, rowsToCsv(indexRows));
  writeAtomic(paths.pendingOutput, rowsToCsv(pendingRows));

  log(`Wrote ${indexRows.length} failures to ${paths.indexOutput}`);
  log(`Wrote ${pendingRows.length} pending items to ${paths.pendingOutput}`);

  return {
    indexCount: indexRows.length,
    pendingCount: pendingRows.length,
    indexRows,
    pendingRows,
  };
}

function isMain() {
  const entry = (process.argv[1] ?? "").replace(/\\/g, "/");
  return entry.endsWith("export-pending-failures.mjs");
}

if (isMain()) {
  exportPendingFailures();
}
