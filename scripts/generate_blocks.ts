import * as fs from 'fs';
import * as path from 'path';
import { buildBlock2D, type Prim } from '@/lib/catalog/blocks2d';

const REPO_ROOT = path.resolve(__dirname, '..');

// We inject these CSS variables into the SVG so the output renders correctly
const cssPath = path.join(REPO_ROOT, 'site/lib/catalog/styles/tokens.css');
let CSS_VARS = '';
if (fs.existsSync(cssPath)) {
  CSS_VARS = fs.readFileSync(cssPath, 'utf8');
} else {
  // Fallback if tokens.css is missing or split
  CSS_VARS = `
  :root {
    --block-surface: var(--text-inverse);
    --block-surface-grad-start: var(--text-inverse);
    --block-surface-grad-end: var(--text-strong);
    --block-surface-stroke: var(--text-inverse-muted);
    --block-seat: var(--text-inverse-body);
    --block-seat-stroke: var(--text-inverse-subtle);
    --block-seat-contour: var(--text-strong);
    --block-seat-backrest: var(--text-inverse-muted);
    --block-seat-backrest-stroke: var(--text-inverse-subtle);
    --block-armrest: var(--text-inverse-muted);
    --block-armrest-soft: var(--text-inverse-subtle);
    --block-caster-base: var(--text-inverse);
    --block-caster-spoke: var(--text-inverse-muted);
    --block-caster-wheel: var(--text-subtle);
    --block-panel: var(--text-inverse-body);
    --block-panel-grad-start: var(--text-inverse);
    --block-glyph: var(--text-inverse-subtle);
    --block-glyph-dark: var(--text-subtle);
    --block-screen-grad-start: var(--text-heading-soft);
    --block-screen-grad-end: var(--text-body);
    --block-shadow-color: var(--shadow-tint-pdp-22);
  }`;
}

function parseWorkstations() {
  const csvPath = path.join(
    REPO_ROOT,
    'site/features/planner/catalog-api/ingest/csv/Workstation and basic storages website.csv',
  );
  if (!fs.existsSync(csvPath)) return [];
  const csvData = fs.readFileSync(csvPath, 'utf8');
  
  const lines = csvData.split('\n');
  interface ParsedBlock { name: string; seaters: number; length: number; depth: number; isSharing: boolean; }
  const blocks: ParsedBlock[] = [];
  let currentMode = 'NS'; 
  
  for (const line of lines) {
    if (line.includes('WORKSTATION: SHARING')) {
      currentMode = 'SH';
      continue;
    }
    
    if (line.includes('seater')) {
      const parts = line.split(',');
      const desc = parts[1];
      const length = parseInt(parts[2], 10);
      const seaters = parseInt(desc.split(' ')[0], 10);
      const isSharing = currentMode === 'SH' || desc.includes('SH');
      
      blocks.push({
        name: `${desc} (${length}mm)`,
        seaters: seaters,
        length: length,
        depth: isSharing ? 1200 : 600, 
        isSharing
      });
    } else if (line.trim().startsWith(',,1350') || line.trim().startsWith(',,1500')) {
      const length = parseInt(line.split(',')[2], 10);
      const prev: ParsedBlock | undefined = blocks[blocks.length - 1];
      if (prev) {
        blocks.push({
          name: `${prev.name.split(' (')[0]} (${length}mm)`,
          seaters: prev.seaters,
          length: length,
          depth: prev.depth,
          isSharing: prev.isSharing
        });
      }
    }
  }
  return blocks;
}

const blocksData = parseWorkstations();
const blocks = [];

for (const data of blocksData) {
  const product = {
    id: 'ws-mock',
    name: data.name,
    category_id: 'workstation',
    sizingType: 'parametric',
    workstation: {
      shape: 'straight',
      system: data.isSharing ? 'partition' : 'none',
      seaterOptions: [data.seaters]
    }
  } as Parameters<typeof buildBlock2D>[0];
  
  const block = buildBlock2D(product, { selection: { seaters: data.seaters, length: data.length, depth: data.depth } });
  if (block) {
    blocks.push({ name: data.name, block });
  }
}

// Add some standalone blocks
const extraProduct: Parameters<typeof buildBlock2D>[0] = { id: 'ped', name: 'Pedestal', category_id: 'storage', sizingType: 'discrete' } as Parameters<typeof buildBlock2D>[0];
const extraBlock = buildBlock2D(extraProduct, { selection: { length: 400, depth: 500 } });
if (extraBlock) blocks.push({ name: 'Mobile Pedestal', block: extraBlock });

const resultsDir = path.join(REPO_ROOT, 'results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

function primToSvg(p: Prim): string {
  const shadow = p.shadowColor ? ` filter="drop-shadow(0 ${p.shadowOffsetY || 0}px ${p.shadowBlur || 0}px ${p.shadowColor})"` : "";
  const transform = p.rotation ? ` transform="rotate(${p.rotation} ${p.offsetX || 0} ${p.offsetY || 0})"` : "";
  const baseAttr = `${shadow}${transform}`;

  if (p.kind === 'rect') {
    const fill = p.fill ?? (p.fillLinearGradientColorStops ? 'url(#grad-surface)' : 'none');
    const stroke = p.stroke ? ` stroke="${p.stroke}" stroke-width="${p.strokeWidth ?? 0}"` : "";
    const rx = p.radius ? ` rx="${p.radius}" ry="${p.radius}"` : "";
    return `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="${fill}"${stroke}${rx}${baseAttr}/>`;
  } else if (p.kind === 'circle') {
    const fill = p.fill ?? (p.fillLinearGradientColorStops ? 'url(#grad-surface)' : 'none');
    const stroke = p.stroke ? ` stroke="${p.stroke}" stroke-width="${p.strokeWidth ?? 0}"` : "";
    return `<circle cx="${p.cx}" cy="${p.cy}" r="${p.r}" fill="${fill}"${stroke}${baseAttr}/>`;
  } else if (p.kind === 'line') {
    const pts = [];
    for (let i = 0; i < p.points.length; i += 2) pts.push(`${p.points[i]},${p.points[i + 1]}`);
    const dash = p.dash ? ` stroke-dasharray="${p.dash.join(' ')}"` : "";
    return `<polyline points="${pts.join(' ')}" fill="none" stroke="${p.stroke}" stroke-width="${p.strokeWidth}"${dash} stroke-linecap="${p.lineCap || 'butt'}"${baseAttr}/>`;
  } else if (p.kind === 'path') {
    const fill = p.fill ?? 'none';
    const stroke = p.stroke ? ` stroke="${p.stroke}" stroke-width="${p.strokeWidth ?? 0}"` : "";
    return `<path d="${p.data}" fill="${fill}"${stroke} stroke-linecap="${p.lineCap || 'butt'}"${baseAttr}/>`;
  }
  return '';
}

const PAD = 480;
const GAP = 150;
let currentY = 0;
let maxW = 0;
const groups: string[] = [];

for (const { name, block } of blocks) {
  const w = block.footprint.L + PAD * 2;
  const h = block.footprint.D + PAD * 2;
  if (w > maxW) maxW = w;

  groups.push(`<g transform="translate(0,${currentY})">`);
  groups.push(`<text x="20" y="30" font-family="Inter, sans-serif" font-size="48" font-weight="600" fill="var(--text-body)">${name}</text>`);
  groups.push(`<text x="20" y="70" font-family="Inter, sans-serif" font-size="28" fill="var(--text-subtle)">${block.footprint.L}×${block.footprint.D}mm · ${block.prims.length} primitives</text>`);

  groups.push(`<g transform="translate(0,90)">`);
  groups.push(`<g transform="translate(${PAD},${PAD})" stroke-linejoin="round">`);
  for (const p of block.prims) {
    groups.push(primToSvg(p));
  }
  groups.push('</g>');
  groups.push('</g>');
  groups.push('</g>');

  currentY += h + 90 + GAP;
}

const totalH = currentY;
const defs = `<defs>
  <linearGradient id="grad-surface" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="var(--block-surface-grad-start, var(--text-inverse))"/>
    <stop offset="100%" stop-color="var(--block-surface-grad-end, var(--text-strong))"/>
  </linearGradient>
</defs>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${maxW} ${totalH}" width="${maxW / 4}" height="${totalH / 4}">
<style>
${CSS_VARS}
</style>
${defs}
${groups.join('\n')}
</svg>`;

const outputPath = path.join(resultsDir, 'actual_engine_blocks.svg');
fs.writeFileSync(outputPath, svg);
console.log(`Written successfully to ${outputPath}`);
