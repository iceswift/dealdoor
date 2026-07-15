// scripts/i18n-audit.ts

import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { getMissingTranslationKeys } from '../src/i18n/index';

const sourceRoot = join(import.meta.dir, '..', 'src');
const excludedDirectories = new Set(['i18n', '__tests__']);
const sourceExtensions = new Set(['.astro', '.ts', '.tsx']);
const thaiText = /[\u0E00-\u0E7F]/;

async function walk(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!excludedDirectories.has(entry.name)) files.push(...await walk(fullPath));
    } else if (sourceExtensions.has(entry.name.slice(entry.name.lastIndexOf('.')))) {
      files.push(fullPath);
    }
  }
  return files;
}

const namespaces = ['common', 'public'] as const;
const missing = namespaces.flatMap((namespace) => getMissingTranslationKeys('en', namespace).map((key) => `${namespace}.${key}`));
if (missing.length > 0) {
  console.error('Missing English translation keys:');
  missing.forEach((key) => console.error(`- ${key}`));
  process.exitCode = 1;
}

const candidates: string[] = [];
for (const file of await walk(sourceRoot)) {
  const content = await readFile(file, 'utf8');
  if (thaiText.test(content)) candidates.push(relative(process.cwd(), file));
}

console.log(`Translation parity: ${missing.length === 0 ? 'ok' : 'failed'}`);
console.log(`Hard-coded Thai inventory: ${candidates.length} source files`);
candidates.forEach((file) => console.log(`- ${file}`));
