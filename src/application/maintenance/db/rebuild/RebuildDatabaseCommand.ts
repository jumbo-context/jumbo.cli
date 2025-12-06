/**
 * RebuildDatabase command
 *
 * Rebuilds the materialized views (SQLite database) by replaying all events
 * from the event store. This is useful for:
 * - Recovering from database corruption
 * - Migrating to a new schema
 * - Fixing projection bugs by replaying with corrected handlers
 */
export interface RebuildDatabaseCommand {
  /**
   * If true, skip confirmation prompt (for automated scripts)
   */
  skipConfirmation?: boolean;
}
