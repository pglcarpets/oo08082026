/** List workflows at HEAD. Run: node scripts/check-head.mjs > check-head-out.txt */
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function git(...args) {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8', shell: true });
  return { code: r.status ?? 1, out: `${r.stdout ?? ''}${r.stderr ?? ''}`.trimEnd() };
}

const lines = [];
lines.push('HEAD check', new Date().toISOString(), '');
for (const [label, args] of [
  ['status', ['status', '-sb']],
  ['log -1', ['log', '-1', '--oneline']],
  ['workflows HEAD', ['ls-tree', '--name-only', 'HEAD', '.github/workflows']],
  ['workflows origin', ['ls-tree', '--name-only', 'origin/main', '.github/workflows']],
  ['show stat', ['show', '--stat', '--oneline', '-1']],
  ['gh runs', []],
]) {
  lines.push(`--- ${label} ---`);
  if (label === 'gh runs') {
    const r = spawnSync(
      'gh',
      ['run', 'list', '--repo', 'pglcarpets/oo08082026', '--limit', '10'],
      { cwd: root, encoding: 'utf8', shell: true },
    );
    lines.push(`${r.stdout ?? ''}${r.stderr ?? ''}`.trimEnd() || '(no output)');
  } else {
    const r = git(...args);
    lines.push(r.out || '(no output)');
  }
  lines.push('');
}

const out = join(root, 'check-head-out.txt');
writeFileSync(out, lines.join('\n'), 'utf8');
console.log('Wrote', out);
