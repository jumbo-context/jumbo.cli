#!/usr/bin/env node
/**
 * Script to update all command files to follow the standard command pattern.
 *
 * Updates:
 * 1. Remove path, fs imports
 * 2. Remove bootstrap, SqliteConnectionManager, event store imports
 * 3. Add ApplicationContainer import
 * 4. Update function signature to include container parameter
 * 5. Remove project initialization check
 * 6. Remove manual dependency wiring
 * 7. Remove finally block with cleanup
 * 8. Add "NO CLEANUP" comment
 * 9. Use Renderer.getInstance() instead of Renderer.configure()
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMMANDS_DIR = path.join(__dirname, '../src/presentation/cli/commands');

// Files to skip (already updated or special cases)
const SKIP_FILES = [
  'session.start.ts',
  'project.init.ts'
];

async function updateFile(filePath) {
  const fileName = path.basename(filePath);

  if (SKIP_FILES.includes(fileName)) {
    console.log(`⏭️  Skipping ${filePath} (excluded)`);
    return false;
  }

  let content = await fs.readFile(filePath, 'utf-8');
  const originalContent = content;

  // 1. Remove path and fs imports
  content = content.replace(/^import path from "path";\n/gm, '');
  content = content.replace(/^import fs from "fs-extra";\n/gm, '');

  // 2. Remove infrastructure imports
  content = content.replace(/^import \{ bootstrap \} from.*bootstrap\.js";\n/gm, '');
  content = content.replace(/^import \{ SqliteConnectionManager \} from.*SqliteConnectionManager\.js";\n/gm, '');
  content = content.replace(/^import \{ InProcessEventBus \} from.*InProcessEventBus\.js";\n/gm, '');
  content = content.replace(/^import \{ .*EventStore \} from.*EventStore\.js";\n/gm, '');
  content = content.replace(/^import \{ .*ProjectionStore \} from.*ProjectionStore\.js";\n/gm, '');
  content = content.replace(/^import \{ .*ProjectionHandler \} from.*ProjectionHandler\.js";\n/gm, '');
  content = content.replace(/^import \{ .*EventHandler \} from.*EventHandler\.js";\n/gm, '');

  // 3. Add ApplicationContainer import if not present
  if (!content.includes('ApplicationContainer')) {
    // Find the CommandMetadata import line
    const metadataImportMatch = content.match(/^import \{ CommandMetadata \} from "\.\.\/\.\.\/registry\/CommandMetadata\.js";$/m);
    if (metadataImportMatch) {
      const importLine = metadataImportMatch[0];
      content = content.replace(
        importLine,
        `${importLine}\nimport { ApplicationContainer } from "../../../../infrastructure/composition/bootstrap.js";`
      );
    }
  }

  // 4. Add Renderer import if using Renderer but not imported
  if (content.includes('Renderer.') && !content.includes('import { Renderer }')) {
    // Find the ApplicationContainer import line
    const containerImportMatch = content.match(/^import \{ ApplicationContainer \} from.*bootstrap\.js";$/m);
    if (containerImportMatch) {
      const importLine = containerImportMatch[0];
      content = content.replace(
        importLine,
        `${importLine}\nimport { Renderer } from "../../rendering/Renderer.js";`
      );
    }
  }

  // 5. Update function signature to include container parameter
  // Match: export async function commandName(options: {...})
  // Replace with: export async function commandName(options: {...}, container: ApplicationContainer)
  content = content.replace(
    /(export async function \w+\(options: [^)]+)\)/g,
    '$1, container: ApplicationContainer)'
  );

  // 6. Remove jumboRoot declaration
  content = content.replace(/^\s*const jumboRoot = path\.join\(process\.cwd\(\), "\.jumbo"\);\n/gm, '');

  // 7. Remove project initialization check
  content = content.replace(/^\s*\/\/ Check if project is initialized\n/gm, '');
  content = content.replace(/^\s*if \(!\(await fs\.pathExists\(jumboRoot\)\)\) \{[\s\S]*?process\.exit\(1\);\n\s*\}\n\n/gm, '');

  // 8. Replace Renderer.configure with Renderer.getInstance
  content = content.replace(/const renderer = Renderer\.configure\(\{\}\);/g, 'const renderer = Renderer.getInstance();');

  // 9. Remove infrastructure creation and wiring (lines between try { and execute command)
  // This is complex, so we'll do it carefully
  content = content.replace(
    /try \{\n\s*\/\/ 1\. Create infrastructure implementations[\s\S]*?\/\/ \d+\. Execute command/g,
    'try {\n    // 1. Create command handler'
  );

  // Also handle cases where there's no numbered comment
  content = content.replace(
    /try \{\n\s*\/\/ Create infrastructure implementations[\s\S]*?\/\/ Execute command/g,
    'try {\n    // 1. Create command handler'
  );

  // 10. Remove wire subscriptions section
  content = content.replace(/\s*\/\/ \d+\. Wire subscriptions.*\n(\s*eventBus\.subscribe\(.*\n)*/g, '\n');
  content = content.replace(/\s*\/\/ Wire subscriptions.*\n(\s*eventBus\.subscribe\(.*\n)*/g, '\n');

  // 11. Update infrastructure usage to use container
  content = content.replace(/new InProcessEventBus\(\)/g, 'container.eventBus');
  content = content.replace(/new \w+EventStore\(jumboRoot\)/g, 'container.$&EventStore');
  content = content.replace(/SqliteConnectionManager\.getConnection\(jumboRoot\)/g, 'container.db');
  content = content.replace(/new Sqlite\w+ProjectionStore\(db\)/g, 'container.$&');

  // 12. Fix handler creation to use container properties
  // This needs to match actual event/projection stores from container
  content = content.replace(
    /const commandHandler = new (\w+Handler)\((eventStore|container\.\w+EventStore), (eventBus|container\.eventBus)(, projectionStore|, container\.\w+ProjectionStore)?\)/g,
    (match, handlerName, eventStore, eventBus, projStore) => {
      const esName = eventStore.startsWith('container.') ? eventStore : 'container.' + eventStore;
      const ebName = eventBus === 'container.eventBus' ? eventBus : 'container.eventBus';
      const psName = projStore ? (projStore.includes('container.') ? projStore.replace(', ', '') : 'container.' + projStore.replace(', ', '')) : '';

      if (psName) {
        return `const commandHandler = new ${handlerName}(${esName}, ${ebName}, ${psName})`;
      } else {
        return `const commandHandler = new ${handlerName}(${esName}, ${ebName})`;
      }
    }
  );

  // 13. Remove finally block with cleanup
  content = content.replace(
    /\s*\} finally \{\n\s*\/\/ Close database connection\n\s*SqliteConnectionManager\.close\(\);\n\s*\}/g,
    '\n  }\n  // NO CLEANUP - infrastructure manages itself!'
  );

  // 14. Clean up multiple blank lines
  content = content.replace(/\n\n\n+/g, '\n\n');

  // Check if content changed
  if (content !== originalContent) {
    await fs.writeFile(filePath, content, 'utf-8');
    console.log(`✅ Updated ${filePath}`);
    return true;
  } else {
    console.log(`ℹ️  No changes needed for ${filePath}`);
    return false;
  }
}

async function findAndUpdateCommands(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  let updatedCount = 0;

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      updatedCount += await findAndUpdateCommands(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      const updated = await updateFile(fullPath);
      if (updated) updatedCount++;
    }
  }

  return updatedCount;
}

async function main() {
  console.log('🔧 Updating command files to standard pattern...\n');

  const updatedCount = await findAndUpdateCommands(COMMANDS_DIR);

  console.log(`\n✨ Done! Updated ${updatedCount} files.`);
}

main().catch(console.error);
