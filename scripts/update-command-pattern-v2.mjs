#!/usr/bin/env node
/**
 * Script v2 to update all command files to follow the standard command pattern.
 * More aggressive cleanup with better pattern matching.
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

async function transformFile(content) {
  const lines = content.split('\n');
  const result = [];
  let inTryBlock = false;
  let skipUntilExecuteCommand = false;
  let foundMetadataClosing = false;
  let metadataImportIndex = -1;
  let hasApplicationContainer = false;
  let hasRenderer = false;

  // First pass: analyze imports
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('ApplicationContainer')) hasApplicationContainer = true;
    if (line.includes('import { Renderer }')) hasRenderer = true;
    if (line.includes('import { CommandMetadata }')) metadataImportIndex = i;
  }

  // Second pass: transform
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip infrastructure imports
    if (
      line.startsWith('import path from') ||
      line.startsWith('import fs from') ||
      line.includes('bootstrap } from') ||
      line.includes('SqliteConnectionManager') ||
      line.includes('InProcessEventBus') ||
      line.includes('EventStore } from') && !line.includes('IEventStore') ||
      line.includes('ProjectionStore } from') && !line.includes('IProjectionStore') ||
      line.includes('ProjectionHandler } from') ||
      line.includes('EventHandler } from')
    ) {
      continue;
    }

    // Add ApplicationContainer import after CommandMetadata if needed
    if (!hasApplicationContainer && i === metadataImportIndex) {
      result.push(line);
      result.push('import { ApplicationContainer } from "../../../../infrastructure/composition/bootstrap.js";');
      hasApplicationContainer = true;
      continue;
    }

    // Add Renderer import after ApplicationContainer if needed and using Renderer
    if (!hasRenderer && hasApplicationContainer && line.includes('ApplicationContainer') && content.includes('Renderer.')) {
      result.push(line);
      result.push('import { Renderer } from "../../rendering/Renderer.js";');
      hasRenderer = true;
      continue;
    }

    // Detect metadata closing brace
    if (line.includes('related:') && line.includes(']')) {
      foundMetadataClosing = true;
    }

    // Update function signature
    if (line.match(/^export async function \w+\(options:/) && !line.includes('container: ApplicationContainer')) {
      // Add container parameter
      const withContainer = line.replace(/\)/, ', container: ApplicationContainer)');
      // Remove duplicate if exists
      const cleaned = withContainer.replace(/, container: ApplicationContainer, container: ApplicationContainer/, ', container: ApplicationContainer');
      result.push(cleaned);
      continue;
    }

    // Skip jumboRoot declaration
    if (line.includes('const jumboRoot = path.join(process.cwd()')) {
      continue;
    }

    // Skip project initialization check
    if (line.trim().startsWith('// Check if project') ||
        (line.includes('if (!(await fs.pathExists') && line.includes('jumboRoot'))) {
      // Skip next 3 lines too (the if block)
      i += 2;
      continue;
    }

    // Update Renderer usage
    if (line.includes('Renderer.configure({})')) {
      result.push(line.replace('Renderer.configure({})', 'Renderer.getInstance()'));
      continue;
    }

    // Detect try block and skip infrastructure setup
    if (line.trim() === 'try {') {
      inTryBlock = true;
      result.push(line);
      skipUntilExecuteCommand = true;
      continue;
    }

    // Inside try block, skip infrastructure setup until we reach command execution
    if (skipUntilExecuteCommand) {
      // Look for command handler creation or command execution
      if (line.includes('const commandHandler = new') ||
          line.includes('const command:') ||
          line.includes('// Execute') ||
          line.includes('// Find active')) {
        // Add simplified comment
        if (line.includes('const commandHandler')) {
          result.push('    // 1. Create command handler');
        } else if (line.includes('// Find active')) {
          result.push('    // 1. Find active session');
        }
        skipUntilExecuteCommand = false;

        // Now process this line
        const transformed = transformInfrastructureUsage(line);
        result.push(transformed);
        continue;
      }
      // Skip all infrastructure setup lines
      continue;
    }

    // Transform infrastructure usage in handler creation
    if (line.includes('const commandHandler = new') || line.includes('const ') && line.includes(' = new')) {
      result.push(transformInfrastructureUsage(line));
      continue;
    }

    // Skip finally block
    if (line.trim() === '} finally {') {
      // Skip until closing brace
      while (i < lines.length && !lines[i].includes('SqliteConnectionManager.close()')) {
        i++;
      }
      i++; // Skip the closing brace
      result.push('  }');
      result.push('  // NO CLEANUP - infrastructure manages itself!');
      continue;
    }

    // Keep everything else
    result.push(line);
  }

  return result.join('\n');
}

function transformInfrastructureUsage(line) {
  let transformed = line;

  // Replace infrastructure creations with container usage
  transformed = transformed.replace(/new InProcessEventBus\(\)/g, 'container.eventBus');
  transformed = transformed.replace(/new GoalEventStore\(jumboRoot\)/g, 'container.goalEventStore');
  transformed = transformed.replace(/new SessionEventStore\(jumboRoot\)/g, 'container.sessionEventStore');
  transformed = transformed.replace(/new ComponentEventStore\(jumboRoot\)/g, 'container.componentEventStore');
  transformed = transformed.replace(/new DependencyEventStore\(jumboRoot\)/g, 'container.dependencyEventStore');
  transformed = transformed.replace(/new DecisionEventStore\(jumboRoot\)/g, 'container.decisionEventStore');
  transformed = transformed.replace(/new InvariantEventStore\(jumboRoot\)/g, 'container.invariantEventStore');
  transformed = transformed.replace(/new GuidelineEventStore\(jumboRoot\)/g, 'container.guidelineEventStore');
  transformed = transformed.replace(/new ArchitectureEventStore\(jumboRoot\)/g, 'container.architectureEventStore');
  transformed = transformed.replace(/new ProjectEventStore\(jumboRoot\)/g, 'container.projectEventStore');
  transformed = transformed.replace(/new AudienceEventStore\(jumboRoot\)/g, 'container.audienceEventStore');
  transformed = transformed.replace(/new AudiencePainEventStore\(jumboRoot\)/g, 'container.audiencePainEventStore');
  transformed = transformed.replace(/new ValuePropositionEventStore\(jumboRoot\)/g, 'container.valuePropositionEventStore');
  transformed = transformed.replace(/new RelationEventStore\(jumboRoot\)/g, 'container.relationEventStore');

  transformed = transformed.replace(/SqliteConnectionManager\.getConnection\(jumboRoot\)/g, 'container.db');

  transformed = transformed.replace(/new SqliteGoalProjectionStore\(db\)/g, 'container.goalProjectionStore');
  transformed = transformed.replace(/new SqliteSessionProjectionStore\(db\)/g, 'container.sessionProjectionStore');
  transformed = transformed.replace(/new SqliteComponentProjectionStore\(db\)/g, 'container.componentProjectionStore');
  transformed = transformed.replace(/new SqliteDependencyProjectionStore\(db\)/g, 'container.dependencyProjectionStore');
  transformed = transformed.replace(/new SqliteDecisionProjectionStore\(db\)/g, 'container.decisionProjectionStore');
  transformed = transformed.replace(/new SqliteInvariantProjectionStore\(db\)/g, 'container.invariantProjectionStore');
  transformed = transformed.replace(/new SqliteGuidelineProjectionStore\(db\)/g, 'container.guidelineProjectionStore');
  transformed = transformed.replace(/new SqliteArchitectureProjectionStore\(db\)/g, 'container.architectureProjectionStore');
  transformed = transformed.replace(/new SqliteProjectProjectionStore\(db\)/g, 'container.projectProjectionStore');
  transformed = transformed.replace(/new SqliteAudienceProjectionStore\(db\)/g, 'container.audienceProjectionStore');
  transformed = transformed.replace(/new SqliteAudiencePainProjectionStore\(db\)/g, 'container.audiencePainProjectionStore');
  transformed = transformed.replace(/new SqliteValuePropositionProjectionStore\(db\)/g, 'container.valuePropositionProjectionStore');
  transformed = transformed.replace(/new SqliteRelationProjectionStore\(db\)/g, 'container.relationProjectionStore');

  // Fix variable references
  transformed = transformed.replace(/\beventStore\b/g, 'container.goalEventStore');
  transformed = transformed.replace(/\beventBus\b/g, 'container.eventBus');
  transformed = transformed.replace(/\bprojectionStore\b/g, 'container.goalProjectionStore');

  return transformed;
}

async function updateFile(filePath) {
  const fileName = path.basename(filePath);

  if (SKIP_FILES.includes(fileName)) {
    console.log(`⏭️  Skipping ${filePath} (excluded)`);
    return false;
  }

  const content = await fs.readFile(filePath, 'utf-8');
  const originalContent = content;

  const transformed = await transformFile(content);

  // Clean up multiple blank lines
  const cleaned = transformed.replace(/\n\n\n+/g, '\n\n');

  // Check if content changed
  if (cleaned !== originalContent) {
    await fs.writeFile(filePath, cleaned, 'utf-8');
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
  console.log('🔧 Updating command files to standard pattern (v2)...\n');

  const updatedCount = await findAndUpdateCommands(COMMANDS_DIR);

  console.log(`\n✨ Done! Updated ${updatedCount} files.`);
}

main().catch(console.error);
