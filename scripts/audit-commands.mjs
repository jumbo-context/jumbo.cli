/**
 * Command Compliance Audit Script
 *
 * Checks all CLI commands for compliance with the standard command pattern.
 * Identifies architectural violations and inconsistencies.
 *
 * Usage: node scripts/audit-commands.mjs
 */

import fs from 'fs-extra';
import fastGlob from 'fast-glob';
import chalk from 'chalk';

async function auditCommands() {
  console.log(chalk.bold('\n🔍 Auditing Command Compliance\n'));

  const commandFiles = await fastGlob('src/presentation/cli/commands/**/*.ts', {
    ignore: ['**/*.test.ts', '**/index.ts'],
    cwd: process.cwd(),
    absolute: true
  });

  const violations = [];
  let compliantCount = 0;

  for (const file of commandFiles) {
    const content = await fs.readFile(file, 'utf-8');
    const fileViolations = [];
    const relativePath = file.replace(process.cwd() + '\\', '').replace(/\\/g, '/');

    // Check 1: Receives container as parameter
    if (!content.includes('container: ApplicationContainer') &&
        !content.includes('container?: ApplicationContainer')) {
      fileViolations.push('❌ Missing container parameter (should receive ApplicationContainer)');
    }

    // Check 2: Does NOT call SqliteConnectionManager.close()
    if (content.includes('SqliteConnectionManager.close()')) {
      fileViolations.push('❌ ARCHITECTURAL VIOLATION: Calls SqliteConnectionManager.close() (commands must NOT manage infrastructure lifecycle)');
    }

    // Check 3: Does NOT call SqliteConnectionManager.getConnection()
    if (content.includes('SqliteConnectionManager.getConnection(')) {
      fileViolations.push('❌ ARCHITECTURAL VIOLATION: Calls SqliteConnectionManager.getConnection() (should use container.dbConnectionManager)');
    }

    // Check 4: Does NOT import old SqliteConnectionManager path
    if (content.includes('from "../../../../infrastructure/persistence/shared/SqliteConnectionManager.js"')) {
      fileViolations.push('❌ Imports old SqliteConnectionManager path (should import from infrastructure/system/ or use container)');
    }

    // Check 5: Does NOT manually call bootstrap() (except project.init)
    const isProjectInit = file.includes('project.init.ts');
    if (!isProjectInit && content.match(/const container = bootstrap\(/)) {
      fileViolations.push('❌ Calls bootstrap() directly (should receive container as parameter)');
    }

    // Check 6: Does NOT create own event stores/buses manually (except project.init)
    if (!isProjectInit) {
      if (content.includes('new InProcessEventBus()')) {
        fileViolations.push('❌ Creates InProcessEventBus manually (should use container.eventBus)');
      }
      if (content.includes('new FsEventStore(')) {
        fileViolations.push('❌ Creates FsEventStore manually (should use container.eventStore)');
      }
    }

    // Check 7: Has finally block with dispose/close (architectural violation, except project.init)
    if (!isProjectInit && content.match(/finally\s*\{[\s\S]*?(dispose|close)\(\)/)) {
      fileViolations.push('❌ ARCHITECTURAL VIOLATION: Has finally block with dispose/close (commands must NOT manage infrastructure lifecycle)');
    }

    if (fileViolations.length > 0) {
      violations.push({ file: relativePath, violations: fileViolations });
    } else {
      compliantCount++;
    }
  }

  // Report results
  console.log(chalk.bold('📊 Results:\n'));

  if (violations.length === 0) {
    console.log(chalk.green.bold(`✅ All ${commandFiles.length} commands follow standard pattern!`));
  } else {
    console.log(chalk.yellow(`⚠️  ${compliantCount} compliant, ${violations.length} non-compliant\n`));

    violations.forEach(({ file, violations }) => {
      console.log(chalk.cyan(file) + ':');
      violations.forEach(v => console.log(`  ${v}`));
      console.log('');
    });

    console.log(chalk.bold('\n📋 Summary of Violations:\n'));

    const violationTypes = new Map();
    violations.forEach(({ violations }) => {
      violations.forEach(v => {
        const count = violationTypes.get(v) || 0;
        violationTypes.set(v, count + 1);
      });
    });

    Array.from(violationTypes.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([violation, count]) => {
        console.log(`  ${chalk.yellow(count.toString().padStart(2))}× ${violation}`);
      });

    console.log(chalk.red.bold(`\n❌ ${violations.length} files need updates\n`));
    process.exit(1);
  }
}

auditCommands().catch(error => {
  console.error(chalk.red('Audit failed:'), error);
  process.exit(1);
});
