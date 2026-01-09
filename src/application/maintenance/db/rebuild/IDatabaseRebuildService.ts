/**
 * Port for database rebuild operations.
 *
 * This abstraction allows the presentation layer to request a database rebuild
 * without knowing how the infrastructure handles closing connections, deleting
 * files, or reinitializing resources.
 *
 * Implementation is in infrastructure layer, following Dependency Inversion.
 */
export interface IDatabaseRebuildService {
  /**
   * Rebuilds the database by:
   * 1. Closing the existing database connection
   * 2. Deleting the database file
   * 3. Reinitializing the database with migrations
   * 4. Replaying all events from the event store
   *
   * @returns Result containing the number of events replayed
   */
  rebuild(): Promise<DatabaseRebuildResult>;
}

export interface DatabaseRebuildResult {
  eventsReplayed: number;
  success: boolean;
}
