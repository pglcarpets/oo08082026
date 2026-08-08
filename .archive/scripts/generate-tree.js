const fs = require('fs');
const path = require('path');

const excludeDirs = new Set(['node_modules', '.git', '.next', 'archive', 'dist', 'results', 'test-results', '.vscode', 'public']);

const domainNarrations = {
  'app/': 'Next.js App Router root',
  'app/api/': 'Backend API routes',
  'components/': 'React UI Components',
  'components/ui/': 'Shared atomic primitives (Buttons, Dialogs)',
  'config/': 'System configurations',
  'config/build/': 'Jest, Playwright, and ESLint configs',
  'config/database/': 'Generated database types',
  'data/': 'Static data and mock databases',
  'features/site/data/': 'Site copy, navigation, and localCatalogIndex.json',
  'features/': 'Feature-Sliced Domain Logic',
  'features/site/advisor/': 'Marketing catalog advisor types and helpers',
  'features/planner/': 'Canonical planner (open3d canvas, catalog, 3D, AI)',
  'features/planner/model/': 'Live planner document kernel (types, actions, operations)',
  'features/planner/cloud-store/': 'Workspace Zustand stores and cloud saves',
  'lib/catalog/site/': 'Product catalog logic (filters, schemas, resolvers)',
  'features/crm/': 'CRM contact surfaces and business stats',
  'features/ops/': 'Internal ops portal views',
  'lib/': 'Shared utilities (auth, catalog, theme, hooks)',
  'features/': 'Domain modules (planner, shared, catalog, ops)',
  'platform/': 'Infrastructure & 3rd-Party Integrations',
  'platform/appwrite/': 'Appwrite client',
  'platform/drizzle/': 'ORM (schema.ts, db.ts, config, and migrations)',
  'platform/supabase/': 'Supabase admin and safe clients',
  'site/platform/route-contract.json': 'Route contract metadata',
  'state/': 'Global State Management',
  'tests/': 'All unit (Vitest) and e2e (Playwright) tests',
  'tools/': 'CLI Tools & Scripts',
  'tools/docs/': 'Operations and audit reports',
  'scripts/': 'Node.js scripts (seeding, migrations, refactoring)'
};

function extractFileIntelligence(filePath) {
  try {
    const ext = path.extname(filePath);
    if (ext === '.json') {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (data.description) return data.description;
      if (data.name) return `JSON config for ${data.name}`;
      return 'JSON Configuration File';
    }
    
    if (ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.jsx' || ext === '.mjs') {
      const content = fs.readFileSync(filePath, 'utf8');
      
      const docMatch = content.match(/^\s*\/\*\*\s*([\s\S]*?)\s*\*\//);
      if (docMatch) {
        let lines = docMatch[1].split('\n').map(l => l.replace(/^\s*\*\s?/, '').trim()).filter(Boolean);
        if (lines.length > 0) return lines[0].substring(0, 100);
      }
      
      const defaultExport = content.match(/export\s+default\s+(?:function|class|async\s+function)\s+([A-Za-z0-9_]+)/);
      if (defaultExport) return `Exports default ${defaultExport[1]}`;
      
      const namedExport = content.match(/export\s+(?:const|function|class|type|interface)\s+([A-Za-z0-9_]+)/);
      if (namedExport) return `Exports ${namedExport[1]}`;
      
      return 'TypeScript/JavaScript Source';
    }

    if (ext === '.md') {
      const content = fs.readFileSync(filePath, 'utf8');
      const header = content.match(/^#\s+(.*)/m);
      if (header) return header[1].substring(0, 100);
      return 'Markdown Document';
    }

    return `${ext.toUpperCase().replace('.', '')} File`;
  } catch (e) {
    return 'File';
  }
}

function getTree(dir, currentDepth, maxDepth) {
  if (currentDepth > maxDepth) return [];
  
  let results = [];
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    items.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

    for (const item of items) {
      if (excludeDirs.has(item.name) || item.name.startsWith('.') && item.name !== '.env.local') continue;
      
      const itemPath = path.join(dir, item.name);
      const relativePath = path.relative('.', itemPath).replace(/\\/g, '/');
      
      if (item.isDirectory()) {
        results.push({ path: relativePath + '/', type: 'dir', depth: currentDepth });
        results = results.concat(getTree(itemPath, currentDepth + 1, maxDepth));
      } else {
        if (currentDepth <= maxDepth) {
            results.push({ path: relativePath, type: 'file', depth: currentDepth, fullPath: itemPath });
        }
      }
    }
  } catch (e) {}
  
  return results;
}

const tree = getTree('.', 1, 8);

let csv = 'Level 1,Level 2,Level 3,Level 4,Level 5,Level 6,Level 7,Level 8,Narration,Remark\n';
tree.forEach(item => {
    const parts = item.path.split('/');
    if (item.type === 'dir') parts.pop();
    
    let l = ['', '', '', '', '', '', '', ''];
    for (let i = 0; i < 8; i++) {
        if (parts.length > i) {
            l[i] = parts[i] + (item.type === 'dir' && parts.length === (i + 1) ? '/' : '');
        }
    }

    let narration = '';
    if (item.type === 'dir') {
       narration = domainNarrations[item.path] || `${parts[parts.length-1]} directory`;
    } else {
       narration = domainNarrations[item.path] || extractFileIntelligence(item.fullPath);
    }
    
    narration = narration.replace(/"/g, '""').replace(/\n/g, ' ');
    
    csv += `"${l[0]}","${l[1]}","${l[2]}","${l[3]}","${l[4]}","${l[5]}","${l[6]}","${l[7]}","${narration}",""\n`;
});

const outPath = path.join(path.resolve(__dirname, '..', '..'), 'results', 'project-tree.csv');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, csv, 'utf8');
console.log('Generated ultra-deep code-intelligent CSV tree with ' + tree.length + ' nodes.');
