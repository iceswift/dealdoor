const { readdirSync, readFileSync, statSync } = require('node:fs');
const { join, relative } = require('node:path');

const root = process.cwd();
const srcDir = join(root, 'src');
const allowedFiles = new Set([
  join(srcDir, 'lib', 'db.ts'),
  join(srcDir, 'lib', 'db.postgres.ts'),
  join(srcDir, 'lib', 'db-sql.ts'),
]);
const checkedExtensions = new Set(['.astro', '.ts', '.tsx']);
const forbiddenPatterns = [
  { name: 'sqlite .get()', pattern: /\.get\(\)/ },
  { name: 'sqlite .all()', pattern: /\.all\(\)/ },
  { name: 'sqlite db.run()', pattern: /\bdb\.run\(/ },
  { name: 'sqlite unixepoch date SQL', pattern: /unixepoch/ },
  { name: 'sqlite json_extract SQL', pattern: /json_extract/ },
  { name: 'sqlite date now SQL', pattern: /date\('now'\)/ },
];
const violations = [];

function hasCheckedExtension(filePath) {
  return [...checkedExtensions].some((extension) => filePath.endsWith(extension));
}

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      if (entry !== 'node_modules' && entry !== 'dist') walk(fullPath);
      continue;
    }

    if (!hasCheckedExtension(fullPath) || allowedFiles.has(fullPath)) continue;

    const content = readFileSync(fullPath, 'utf8');
    for (const item of forbiddenPatterns) {
      if (item.pattern.test(content)) {
        violations.push(`${relative(root, fullPath)} uses ${item.name}`);
      }
    }
  }
}

walk(srcDir);

if (violations.length > 0) {
  console.error('Runtime portability check failed:');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log('Runtime portability check passed.');
