import http from "node:http";

function get(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

const urls = [
  "http://localhost:3010/_next/static/chunks/site_focss_oostudio_entry_1biaty6.css",
  "http://localhost:3010/_next/static/chunks/_16w8_f7._.css",
  "http://localhost:3010/_next/static/chunks/%5Bnext%5D_internal_font_google_inter_5972bc34_module_1w3amv-.css",
];

for (const url of urls) {
  const css = await get(url);
  console.log("\n====", url.split("/").pop(), "len", css.length);
  // Find background declarations that span lines (value continues without ;)
  const lines = css.split(/\n/);
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!/\bbackground(-color|-image)?\s*:/.test(l)) continue;
    if (!l.includes(";") && i + 1 < lines.length) {
      const block = [l, lines[i + 1], lines[i + 2] ?? ""].join("\n");
      if (/background(-color|-image)?\s*:\s*$/.test(l.trim()) || /,\s*$/.test(l.trim())) {
        console.log("multiline@", i + 1, block.replace(/\s+/g, " ").slice(0, 200));
      }
    }
  }
  // Flag exotic values
  const re = /background(?:-color|-image)?\s*:\s*([^;{}]+);/g;
  let m;
  const odd = [];
  while ((m = re.exec(css))) {
    const v = m[1].trim();
    if (v === "" || v === "undefined" || /\bNaN\b/.test(v) || /var\(\s*--[^)]+\)\s+var\(/.test(v)) {
      odd.push(v.slice(0, 120));
    }
    // Firefox historically fussy about color-mix with currentcolor / blank
    if (/color-mix\([^)]*\)\s+color-mix/.test(v)) odd.push(v.slice(0, 120));
  }
  console.log("odd values", odd.slice(0, 10));
}
