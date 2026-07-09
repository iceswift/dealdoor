const { readdirSync, readFileSync, statSync } = require('node:fs');
const { join, relative } = require('node:path');

const root = process.cwd();
const srcDir = join(root, 'src');
const allowedFiles = new Set([
  join(srcDir, 'lib', 'db-schema.ts'),
  join(srcDir, 'lib', 'db-schema.postgres.ts'),
]);

const directSchemaImportPattern = /from\s+['"][^'"]*db\/schema(?:\.pg)?['"]/;
const checkedExtensions = new Set(['.astro', '.ts', '.tsx']);
const violations = [];

function hasCheckedExtension(filePath) {
  return [...checkedExtensions].some((extension) => filePath.endsWith(extension));
}

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      if (entry === 'dist' || entry === 'node_modules') continue;
      walk(fullPath);
      continue;
    }

    if (!hasCheckedExtension(fullPath) || allowedFiles.has(fullPath)) continue;

    const content = readFileSync(fullPath, 'utf8');
    if (directSchemaImportPattern.test(content)) {
      violations.push(relative(root, fullPath));
    }
  }
}

walk(srcDir);

if (violations.length > 0) {
  console.error('Runtime schema boundary check failed. Import from src/lib/db-schema instead of db/schema:');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log('Runtime schema boundary check passed.');
