/**
 * Copies all namespace migration files to the dist directory.
 *
 * This script is part of the build process and ensures that SQL migration
 * files are included in the npm package distribution.
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const srcInfraDir = path.join(rootDir, 'src', 'infrastructure');
const distInfraDir = path.join(rootDir, 'dist', 'infrastructure');

// All namespace migration directories following Clean Screaming Architecture
const namespaces = [
  'work/sessions',
  'work/goals',
  'solution/decisions',
  'solution/architecture',
  'solution/components',
  'solution/dependencies',
  'solution/guidelines',
  'solution/invariants',
  'project-knowledge/project',
  'project-knowledge/audiences',
  'project-knowledge/audience-pains',
  'project-knowledge/value-propositions',
  'relations',
];

let copiedCount = 0;

for (const namespace of namespaces) {
  const srcMigrationsDir = path.join(srcInfraDir, namespace, 'migrations');
  const distMigrationsDir = path.join(distInfraDir, namespace, 'migrations');

  if (fs.existsSync(srcMigrationsDir)) {
    fs.copySync(srcMigrationsDir, distMigrationsDir);
    const files = fs.readdirSync(srcMigrationsDir).filter(f => f.endsWith('.sql'));
    copiedCount += files.length;
  }
}

console.log(`✅ Copied ${copiedCount} migration files to dist/`);
