import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const argMap = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index];
  if (!arg.startsWith("--")) continue;
  const key = arg.slice(2);
  const next = process.argv[index + 1];
  if (next && !next.startsWith("--")) {
    argMap.set(key, next);
    index += 1;
  } else {
    argMap.set(key, "true");
  }
}

const sourceDirArg = argMap.get("source") ?? "project";
const outputDirArg = argMap.get("output") ?? "results/project-rendered";
const rootLabel = argMap.get("label") ?? "Project Mirror";
const sourceRoot = path.resolve(repoRoot, sourceDirArg);
const outputRoot = path.resolve(repoRoot, outputDirArg);
const sourceRootName = path.basename(sourceRoot);
const sourceGlobLabel = `${sourceDirArg.replace(/\\/g, "/")}/**/*.md`;

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function slugify(value) {
  return value.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
}

function inlineMarkdown(value) {
  let rendered = escapeHtml(value);
  rendered = rendered.replace(/`([^`]+)`/g, (_, code) => `<code>${escapeHtml(code)}</code>`);
  rendered = rendered.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, target) => {
    let href = target.trim();
    if (href.endsWith(".md")) href = href.replace(/\.md$/i, ".html");
    if (href.endsWith("/README.html")) href = href.replace(/\/README\.html$/i, "/index.html");
    if (href.endsWith("/README.md")) href = href.replace(/\/README\.md$/i, "/index.html");
    return `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;
  });
  return rendered;
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const headings = [];
  const parts = [];
  let inCodeBlock = false;
  let codeFenceLang = "";
  let codeBuffer = [];
  let inUl = false;
  let inOl = false;
  let paragraph = [];

  const closeParagraph = () => {
    if (paragraph.length === 0) return;
    parts.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  };

  const closeLists = () => {
    if (inUl) {
      parts.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      parts.push("</ol>");
      inOl = false;
    }
  };

  const closeCodeBlock = () => {
    const code = escapeHtml(codeBuffer.join("\n"));
    const className = codeFenceLang ? ` class="language-${escapeHtml(codeFenceLang)}"` : "";
    parts.push(`<pre><code${className}>${code}</code></pre>`);
    codeBuffer = [];
    codeFenceLang = "";
    inCodeBlock = false;
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\t/g, "  ");

    if (inCodeBlock) {
      if (line.startsWith("```")) {
        closeCodeBlock();
      } else {
        codeBuffer.push(rawLine);
      }
      continue;
    }

    if (line.startsWith("```")) {
      closeParagraph();
      closeLists();
      inCodeBlock = true;
      codeFenceLang = line.slice(3).trim();
      continue;
    }

    if (!line.trim()) {
      closeParagraph();
      closeLists();
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      closeParagraph();
      closeLists();
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      const id = slugify(text);
      headings.push({ level, text, id });
      parts.push(`<h${level} id="${id}">${inlineMarkdown(text)}</h${level}>`);
      continue;
    }

    const ulMatch = line.match(/^\s*-\s+(.+)$/);
    if (ulMatch) {
      closeParagraph();
      if (inOl) {
        parts.push("</ol>");
        inOl = false;
      }
      if (!inUl) {
        parts.push("<ul>");
        inUl = true;
      }
      parts.push(`<li>${inlineMarkdown(ulMatch[1])}</li>`);
      continue;
    }

    const olMatch = line.match(/^\s*\d+\.\s+(.+)$/);
    if (olMatch) {
      closeParagraph();
      if (inUl) {
        parts.push("</ul>");
        inUl = false;
      }
      if (!inOl) {
        parts.push("<ol>");
        inOl = true;
      }
      parts.push(`<li>${inlineMarkdown(olMatch[1])}</li>`);
      continue;
    }

    paragraph.push(line.trim());
  }

  if (inCodeBlock) closeCodeBlock();
  closeParagraph();
  closeLists();

  return { html: parts.join("\n"), headings };
}

async function walkMarkdownFiles(dir, results = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkMarkdownFiles(fullPath, results);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      results.push(fullPath);
    }
  }
  return results;
}

function outputPathFor(sourcePath) {
  const relative = path.relative(sourceRoot, sourcePath);
  if (path.basename(relative).toLowerCase() === "readme.md") {
    return path.join(outputRoot, path.dirname(relative), "index.html");
  }
  return path.join(outputRoot, relative.replace(/\.md$/i, ".html"));
}

function navHrefFromSource(sourcePath) {
  return path.relative(sourceRoot, outputPathFor(sourcePath)).replace(/\\/g, "/");
}

function buildTree(sourceFiles) {
  const root = { name: sourceRootName, href: "index.html", children: [] };
  const sorted = [...sourceFiles].sort((a, b) => a.localeCompare(b));

  for (const file of sorted) {
    const relative = path.relative(sourceRoot, file).replace(/\\/g, "/");
    if (relative === "README.md") continue;
    const parts = relative.split("/");
    let cursor = root;
    let sourceCursor = sourceRoot;

    for (let index = 0; index < parts.length; index += 1) {
      const part = parts[index];
      const isLast = index === parts.length - 1;
      const isReadme = isLast && part.toLowerCase() === "readme.md";
      const name = isReadme ? path.basename(path.dirname(path.join(sourceCursor, part))) : part.replace(/\.md$/i, "");
      let child = cursor.children.find((item) => item.name === name);
      if (!child) {
        child = { name, href: null, children: [] };
        cursor.children.push(child);
      }
      if (isLast) child.href = navHrefFromSource(file);
      cursor = child;
      sourceCursor = path.join(sourceCursor, part);
    }
  }

  return root;
}

function renderTree(node, currentHref) {
  const children = [...node.children].sort((a, b) => a.name.localeCompare(b.name));
  if (children.length === 0) return "";
  const items = children
    .map((child) => {
      const active = child.href === currentHref ? ' class="active"' : "";
      const label = child.href
        ? `<a${active} href="${escapeHtml(child.href)}">${escapeHtml(child.name)}</a>`
        : `<span>${escapeHtml(child.name)}</span>`;
      return `<li>${label}${renderTree(child, currentHref)}</li>`;
    })
    .join("");
  return `<ul>${items}</ul>`;
}

function pageTemplate({ title, bodyHtml, tocHtml, navHtml, relativeRoot }) {
  const rootLink = relativeRoot || ".";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      --color-primary: #1f3653;
      --color-primary-hover: #1b3049;
      --color-accent: #9d876c;
      --color-accent-strong: #7f6a52;
      --surface-page: #ffffff;
      --surface-soft: #fafbfc;
      --surface-muted: #f5f7fa;
      --surface-panel: rgba(255, 255, 255, 0.94);
      --surface-panel-soft: rgba(255, 255, 255, 0.88);
      --surface-inverse: #070d12;
      --text-heading: #050b17;
      --text-body: #1b2940;
      --text-muted: #4a5c76;
      --text-subtle: #64748b;
      --text-inverse: #f8fafc;
      --border-soft: #d2dce7;
      --border-strong: #4b719f;
      --shadow-panel: 0 24px 56px -42px rgba(17, 30, 45, 0.2);
      --shadow-float: 0 32px 80px -48px rgba(17, 30, 45, 0.26);
      --focus-ring: 0 0 0 3px rgba(64, 111, 153, 0.25);
      --radius-lg: 1.25rem;
      --radius-xl: 1.5rem;
      --radius-giant: 1.6rem;
      --radius-pill: 999px;
      --font-display: "Helvetica Neue", "Cisco Sans", Helvetica, Arial, sans-serif;
      --font-sans: "Helvetica Neue", "Cisco Sans", Helvetica, Arial, sans-serif;
      --font-mono: "JetBrains Mono", "Cascadia Code", Consolas, monospace;
      --motion-fast: 180ms;
      --motion-base: 240ms;
      --ease-standard: cubic-bezier(0.22, 1, 0.36, 1);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: var(--font-sans);
      background:
        radial-gradient(circle at top left, rgba(159, 135, 108, 0.12) 0%, transparent 30%),
        linear-gradient(180deg, #f5f7fa 0%, #ffffff 48%, #fafbfc 100%);
      color: var(--text-body);
      line-height: 1.68;
    }
    a {
      color: var(--color-primary);
      text-decoration: none;
      transition: color var(--motion-fast) var(--ease-standard);
    }
    a:hover { text-decoration: underline; }
    code {
      font-family: var(--font-mono);
      background: var(--surface-muted);
      color: var(--color-primary);
      padding: 0.14rem 0.4rem;
      border-radius: 0.5rem;
      font-size: 0.92em;
    }
    pre {
      overflow: auto;
      background: linear-gradient(180deg, #0b141d 0%, #111e2d 100%);
      color: var(--text-inverse);
      padding: 1.1rem 1.2rem;
      border-radius: var(--radius-xl);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
    }
    pre code { background: transparent; padding: 0; color: inherit; }
    .layout {
      display: grid;
      grid-template-columns: 19rem minmax(0, 1fr) 16rem;
      gap: 1.25rem;
      max-width: 1440px;
      margin: 0 auto;
      padding: 1.25rem;
    }
    .panel {
      background: var(--surface-panel);
      border: 1px solid var(--border-soft);
      border-radius: var(--radius-giant);
      box-shadow: var(--shadow-panel);
      backdrop-filter: blur(14px);
    }
    .sidebar, .toc {
      position: sticky;
      top: 1rem;
      align-self: start;
      max-height: calc(100vh - 2rem);
      overflow: auto;
      padding: 1rem 1rem 1.25rem;
    }
    .content {
      padding: 2.15rem 2.4rem 3rem;
      min-width: 0;
    }
    .brand {
      display: inline-flex;
      align-items: center;
      margin-bottom: 1rem;
      padding: 0.55rem 0.9rem;
      border-radius: var(--radius-pill);
      border: 1px solid rgba(159, 135, 108, 0.28);
      background: rgba(159, 135, 108, 0.12);
      color: var(--color-accent-strong);
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    h1, h2, h3, h4, h5, h6 {
      font-family: var(--font-display);
      color: var(--text-heading);
      line-height: 1.08;
      letter-spacing: -0.04em;
      margin: 1.4em 0 0.55em;
    }
    h1 {
      font-size: clamp(2.3rem, 4vw, 3.8rem);
      margin-top: 0.15rem;
    }
    h2 { font-size: clamp(1.5rem, 2vw, 2.15rem); }
    h3 { font-size: 1.2rem; }
    p, ul, ol { margin: 0 0 1rem; }
    ul, ol { padding-left: 1.2rem; }
    .meta {
      margin-bottom: 1.4rem;
      color: var(--text-subtle);
      font-size: 0.82rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .sidebar h2, .toc h2 {
      margin: 0 0 0.75rem;
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      color: var(--text-subtle);
    }
    .sidebar ul, .toc ul {
      list-style: none;
      padding-left: 0.75rem;
      margin: 0;
      border-left: 1px solid var(--border-soft);
    }
    .sidebar li, .toc li { margin: 0.3rem 0; }
    .sidebar a, .toc a {
      display: inline-flex;
      width: 100%;
      padding: 0.35rem 0.55rem;
      border-radius: 0.8rem;
      color: var(--text-muted);
      text-decoration: none;
    }
    .sidebar a:hover, .toc a:hover {
      background: rgba(31, 54, 83, 0.06);
      color: var(--color-primary-hover);
      text-decoration: none;
    }
    .sidebar a.active, .toc a.active {
      background: rgba(31, 54, 83, 0.08);
      color: var(--text-heading);
      font-weight: 700;
    }
    .sidebar span {
      display: inline-flex;
      width: 100%;
      padding: 0.35rem 0.55rem;
      color: var(--text-subtle);
      font-size: 0.95rem;
    }
    .content ul li::marker,
    .content ol li::marker {
      color: var(--color-accent-strong);
    }
    .content strong {
      color: var(--text-heading);
    }
    .content blockquote {
      margin: 0 0 1rem;
      padding: 0.9rem 1rem;
      border-left: 3px solid var(--color-accent);
      border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
      background: rgba(159, 135, 108, 0.08);
      color: var(--text-muted);
    }
    .footer {
      margin-top: 2rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--border-soft);
      color: var(--text-subtle);
      font-size: 0.88rem;
    }
    @media (max-width: 1100px) {
      .layout { grid-template-columns: 17rem minmax(0, 1fr); }
      .toc { display: none; }
    }
    @media (max-width: 820px) {
      .layout { grid-template-columns: 1fr; padding: 0.75rem; }
      .sidebar { position: static; max-height: none; }
      .content { padding: 1.35rem 1rem 2rem; }
    }
  </style>
</head>
<body>
  <div class="layout">
    <aside class="sidebar panel">
      <a class="brand" href="${escapeHtml(path.join(rootLink, "index.html").replace(/\\/g, "/"))}">${escapeHtml(rootLabel)}</a>
      <h2>Sections</h2>
      ${navHtml}
    </aside>
    <main class="content panel">
      ${bodyHtml}
      <div class="footer">Generated from <code>${escapeHtml(sourceGlobLabel)}</code> by <code>scripts/render_project_docs.mjs</code>.</div>
    </main>
    <aside class="toc panel">
      <h2>On This Page</h2>
      ${tocHtml || "<p>No section anchors.</p>"}
    </aside>
  </div>
</body>
</html>`;
}

async function emptyDir(dirPath) {
  await fs.rm(dirPath, { recursive: true, force: true });
  await fs.mkdir(dirPath, { recursive: true });
}

async function main() {
  const sourceFiles = await walkMarkdownFiles(sourceRoot);
  await emptyDir(outputRoot);
  const tree = buildTree(sourceFiles);

  for (const sourceFile of sourceFiles) {
    const markdown = await fs.readFile(sourceFile, "utf8");
    const { html, headings } = renderMarkdown(markdown);
    const outputPath = outputPathFor(sourceFile);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    const currentHref = path.relative(outputRoot, outputPath).replace(/\\/g, "/");
    const tocHtml = headings.length
      ? `<ul>${headings.filter((item) => item.level <= 3).map((item) => `<li><a href="#${item.id}">${escapeHtml(item.text)}</a></li>`).join("")}</ul>`
      : "";

    const relativeRoot = path.relative(path.dirname(outputPath), outputRoot).replace(/\\/g, "/") || ".";
    const navHtml = renderTree(tree, currentHref);
    const sourceLabel = path.relative(repoRoot, sourceFile).replace(/\\/g, "/");
    const sourcePrefix = `${sourceDirArg.replace(/\\/g, "/")}/`;
    const title = sourceLabel === `${sourceDirArg.replace(/\\/g, "/")}/README.md`
      ? sourceRootName
      : sourceLabel.replace(new RegExp(`^${sourcePrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`), "").replace(/\/README\.md$/i, "").replace(/\.md$/i, "");

    const page = pageTemplate({
      title,
      bodyHtml: `<div class="meta">${escapeHtml(sourceLabel)}</div>\n${html}`,
      tocHtml,
      navHtml,
      relativeRoot,
    });

    await fs.writeFile(outputPath, page, "utf8");
  }

  console.log(`Rendered ${sourceFiles.length} markdown files from ${path.relative(repoRoot, sourceRoot)} into ${path.relative(repoRoot, outputRoot)}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
