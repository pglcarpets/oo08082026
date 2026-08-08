/** Parse HEAD tree without git CLI. Writes check-head-out.txt */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outFile = join(root, 'check-head-out.txt');

function readHeadSha() {
  return readFileSync(join(root, '.git/refs/heads/main'), 'utf8').trim();
}

function readObject(sha) {
  const loose = join(root, '.git/objects', sha.slice(0, 2), sha.slice(2));
  if (!existsSync(loose)) return null;
  const buf = gunzipSync(readFileSync(loose));
  const nul = buf.indexOf(0);
  const header = buf.slice(0, nul).toString();
  const [type] = header.split(' ');
  return { type, body: buf.slice(nul + 1) };
}

function parseTree(body) {
  const entries = [];
  let i = 0;
  while (i < body.length) {
    const modeEnd = body.indexOf(0x20, i);
    const mode = body.slice(i, modeEnd).toString();
    const nameEnd = body.indexOf(0, modeEnd);
    const name = body.slice(modeEnd + 1, nameEnd).toString();
    const sha = body.slice(nameEnd + 1, nameEnd + 21).toString('hex');
    entries.push({ mode, name, sha });
    i = nameEnd + 21;
  }
  return entries;
}

function walkTree(sha, prefix = '') {
  const obj = readObject(sha);
  if (!obj || obj.type !== 'tree') return [];
  const out = [];
  for (const e of parseTree(obj.body)) {
    const path = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.mode.startsWith('04')) out.push(...walkTree(e.sha, path));
    else out.push(path);
  }
  return out;
}

function commitMessage(sha) {
  const obj = readObject(sha);
  if (!obj || obj.type !== 'commit') return '';
  const text = obj.body.toString();
  return text.split('\n\n').slice(1).join('\n\n').trim();
}

function commitTree(sha) {
  const obj = readObject(sha);
  if (!obj || obj.type !== 'commit') return null;
  const firstLine = obj.body.toString().split('\n')[0];
  return firstLine.replace('tree ', '').trim();
}

const head = readHeadSha();
const origin = existsSync(join(root, '.git/refs/remotes/origin/main'))
  ? readFileSync(join(root, '.git/refs/remotes/origin/main'), 'utf8').trim()
  : '(missing)';

const treeSha = commitTree(head);
const allFiles = treeSha ? walkTree(treeSha) : [];
const workflows = allFiles.filter((p) => p.startsWith('.github/workflows/'));
const ciRelated = allFiles.filter(
  (p) =>
    p.startsWith('.github/workflows/') ||
    p === 'scripts/general/check-governance.mjs' ||
    p === 'tests/unit/lib/assetPaths.test.ts' ||
    p === 'scripts/create-private-repo.ps1',
);

const lines = [
  `generated ${new Date().toISOString()}`,
  `HEAD ${head}`,
  `origin/main ${origin}`,
  `in_sync ${head === origin}`,
  '',
  `commit_message: ${commitMessage(head)}`,
  '',
  '--- .github/workflows on HEAD ---',
  ...(workflows.length ? workflows : ['(none committed)']),
  '',
  '--- CI-related paths on HEAD ---',
  ...ciRelated,
  '',
];

writeFileSync(outFile, lines.join('\n'), 'utf8');
console.log(`Wrote ${outFile}`);
