import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const recoveryDir = path.join(rootDir, ".codex-recovery");
const chatDir = path.join(recoveryDir, "chat-snapshots");
const latestPath = path.join(chatDir, "latest-chat.md");
const args = process.argv.slice(2);

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function getFlagValue(prefix, fallback = "") {
  const match = args.find((arg) => arg.startsWith(`${prefix}=`));
  return match ? match.slice(prefix.length + 1) : fallback;
}

function timestampParts(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  const second = pad(date.getSeconds());

  return {
    iso: `${year}-${month}-${day}T${hour}:${minute}:${second}`,
    fileSafe: `${year}-${month}-${day}_${hour}-${minute}-${second}`,
  };
}

async function readStdin() {
  if (process.stdin.isTTY) {
    return "";
  }

  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolve(data.trim()));
  });
}

async function main() {
  ensureDir(chatDir);

  const stamp = timestampParts();
  const noteFromFlag = getFlagValue("--note", "").trim();
  const noteFromStdin = await readStdin();
  const note = noteFromFlag || noteFromStdin || "_No chat summary was provided._";

  const content = [
    "# Chat Snapshot",
    "",
    `- Timestamp: ${stamp.iso}`,
    "",
    "## Summary",
    note,
    "",
    "## Resume From",
    "- `.codex-recovery/latest.md`",
    "- `.codex-recovery/NEXT-PLAN.md`",
    "- `.codex-recovery/RECOVERY-CHECKLIST.md`",
    "",
  ].join("\n");

  const filePath = path.join(chatDir, `chat-${stamp.fileSafe}.md`);
  fs.writeFileSync(filePath, content, "utf8");
  fs.writeFileSync(latestPath, content, "utf8");

  console.log(`WROTE=${path.relative(rootDir, filePath).replace(/\\/g, "/")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
