#!/usr/bin/env node
/**
 * Simple script to fix the 3 violations identified by audit script
 */

import fs from 'fs-extra';
import fastGlob from 'fast-glob';

async function fixFile(filePath) {
  let content = await fs.readFile(filePath, 'utf-8');
  const original = content;

  // 1. Remove SqliteConnectionManager import
  content = content.replace(/^import \{ SqliteConnectionManager \} from.*SqliteConnectionManager\.js";\n/gm, '');

  // 2. Remove finally block with SqliteConnectionManager.close()
  content = content.replace(/\s*\} finally \{\s*\/\/ Close database connection\s*SqliteConnectionManager\.close\(\);\s*\}/gs, '\n  }\n  // NO CLEANUP - infrastructure manages itself!');

  // Clean up extra blank lines
  content = content.replace(/\n\n\n+/g, '\n\n');

  if (content !== original) {
    await fs.writeFile(filePath, content, 'utf-8');
    console.log(`✅ Fixed ${filePath.replace(process.cwd(), '').replace(/\\/g, '/')}`);
    return true;
  }
  return false;
}

async function main() {
  console.log('🔧 Fixing command violations...\n');

  const commandFiles = await fastGlob('src/presentation/cli/commands/**/*.ts', {
    ignore: ['**/*.test.ts', '**/index.ts', '**/project.init.ts'],
    cwd: process.cwd(),
    absolute: true
  });

  let fixed = 0;
  for (const file of commandFiles) {
    const wasFixed = await fixFile(file);
    if (wasFixed) fixed++;
  }

  console.log(`\n✨ Fixed ${fixed} files`);
}

main().catch(console.error);
