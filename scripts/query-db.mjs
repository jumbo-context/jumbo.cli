#!/usr/bin/env node
/**
 * Query SQLite database using better-sqlite3
 *
 * This script replaces the need for sqlite3 CLI tool which may not be installed.
 * Uses the project's existing better-sqlite3 dependency.
 *
 * Usage:
 *   npm run db:query                    # List all tables
 *   npm run db:query -- architecture_views   # Query specific table
 *   node scripts/query-db.mjs architecture_views  # Direct usage
 *
 * Available tables:
 *   - architecture_views
 *   - decision_views
 *   - project_views
 *   - goal_views (when implemented)
 *   - session_views (when implemented)
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(process.cwd(), '.jumbo', 'jumbo.db');

try {
  const db = new Database(dbPath, { readonly: true });

  const tableName = process.argv[2];

  if (!tableName) {
    // List all tables
    const tables = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table'
      ORDER BY name
    `).all();

    console.log('\n📊 Available tables:');
    tables.forEach(t => console.log(`  - ${t.name}`));
    console.log('\nUsage: node scripts/query-db.mjs [table-name]\n');
    process.exit(0);
  }

  // Query specific table
  const rows = db.prepare(`SELECT * FROM ${tableName}`).all();

  if (rows.length === 0) {
    console.log(`\n📋 Table '${tableName}' is empty\n`);
  } else {
    console.log(`\n📋 Table '${tableName}' (${rows.length} rows):\n`);
    console.log(JSON.stringify(rows, null, 2));
  }

  db.close();
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
  process.exit(1);
}
