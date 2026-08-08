import http from "node:http";

function get(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve({ status: res.statusCode, data, headers: res.headers }));
      })
      .on("error", reject);
  });
}

const page = await get("http://localhost:3010/oostudio");
console.log("page", page.status);
const links = [...page.data.matchAll(/href="([^"]+\.css)"/g)].map((m) => m[1]);
console.log(links.slice(0, 25).join("\n"));
const entry = links.find((u) => u.includes("oostudio_entry") || u.includes("focss_oostudio"));
console.log("ENTRY", entry);
if (!entry) process.exit(1);
const url = entry.startsWith("http") ? entry : `http://localhost:3010${entry}`;
const css = await get(url);
const lines = css.data.split(/\n/);
console.log("css lines", lines.length, "status", css.status);
for (let i = 165; i <= 185; i++) {
  console.log(String(i).padStart(4) + "|" + (lines[i - 1] ?? ""));
}
const moz = lines.findIndex((l) => l.includes("moz-osx"));
console.log("moz line", moz + 1, lines[moz]);
const bgLines = [];
lines.forEach((l, i) => {
  if (!/background\s*:/.test(l)) return;
  if (/background\s*:\s*;|background\s*:\s*$/.test(l)) bgLines.push(`${i + 1}: EMPTY ${l.trim()}`);
  if (/background:[^;]*var\(\s*--[a-z0-9-]+\s*\)\s+[a-z]/i.test(l)) bgLines.push(`${i + 1}: MULTI ${l.trim().slice(0, 140)}`);
});
console.log("suspect backgrounds", bgLines.slice(0, 30));
