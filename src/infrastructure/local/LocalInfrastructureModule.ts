/**
 * LocalInfrastructureModule - Self-Disposing Infrastructure Lifecycle Manager
 *
 * Encapsulates local infrastructure resources (SQLite database, file-based event store)
 * with automatic lifecycle management. This module follows the RAII pattern where
 * resources are acquired on construction and automatically released on process exit.
 *
 * Key Design Principles:
 * - **Self-Disposing**: Registers process signal handlers for automatic cleanup
 * - **No Public dispose()**: Presentation layer never calls cleanup methods
 * - **Interface Exposure**: Factory methods return interfaces, never concrete resources
 * - **Infrastructure Isolation**: Resources are fully encapsulated within this module
 *
 * Lifecycle:
 * 1. Construction: Database connection and event store initialized
 * 2. Signal Registration: Handlers for exit, SIGINT, SIGTERM registered
 * 3. Runtime: Factory methods provide interface access to resources
 * 4. Termination: Process signals trigger automatic resource cleanup
 *
 * Architecture Decision: RAII Pattern for Infrastructure Lifecycle
 * - Infrastructure should manage its own resources
 * - Presentation layer should only validate, route, and render
 * - No disposal calls should leak to presentation layer
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { IDbConnectionManager } from "../shared/persistence/IDbConnectionManager.js";
import { IEventStore } from "../../application/shared/persistence/IEventStore.js";
import { IEventBus } from "../../application/shared/messaging/IEventBus.js";
import { IClock } from "../../application/shared/system/IClock.js";
import { FsEventStore } from "../shared/persistence/FsEventStore.js";
import { InProcessEventBus } from "../shared/messaging/InProcessEventBus.js";
import { SystemClock } from "../shared/system/SystemClock.js";
import { MigrationRunner } from "../shared/persistence/MigrationRunner.js";
import { getNamespaceMigrations } from "../shared/persistence/migrations.config.js";

/**
 * Internal connection manager that implements IDbConnectionManager
 * without exposing disposal to external consumers.
 */
class InternalConnectionManager implements IDbConnectionManager {
  private connection: Database.Database;
  private disposed = false;

  constructor(dbPath: string) {
    const isNewDatabase = !fs.existsSync(dbPath);

    this.connection = new Database(dbPath);
    this.connection.pragma("journal_mode = WAL");

    if (isNewDatabase) {
      const infrastructureDir = path.resolve(__dirname, "..");
      const migrations = getNamespaceMigrations(infrastructureDir);
      const migrationRunner = new MigrationRunner(this.connection);
      migrationRunner.runNamespaceMigrations(migrations);
    }
  }

  getConnection(): Database.Database {
    return this.connection;
  }

  /**
   * Internal disposal - not part of IDbConnectionManager interface
   * for external consumers. Only called by LocalInfrastructureModule.
   */
  internalDispose(): void {
    if (!this.disposed && this.connection && this.connection.open) {
      this.connection.pragma("wal_checkpoint(TRUNCATE)");
      this.connection.close();
      this.disposed = true;
    }
  }

  /**
   * IDisposable implementation - delegates to internal disposal.
   * This method exists to satisfy the interface but should not
   * be called by presentation layer code.
   */
  async dispose(): Promise<void> {
    this.internalDispose();
  }
}

export class LocalInfrastructureModule {
  private readonly connectionManager: InternalConnectionManager;
  private readonly eventStore: FsEventStore;
  private readonly eventBus: InProcessEventBus;
  private readonly clock: SystemClock;
  private disposed = false;
  private signalHandlersRegistered = false;

  /**
   * Creates a new LocalInfrastructureModule with self-disposing lifecycle.
   *
   * RAII Pattern: All resources are acquired here and will be automatically
   * released when the process exits via registered signal handlers.
   *
   * @param rootDir - The root directory for Jumbo data (typically .jumbo)
   */
  constructor(rootDir: string) {
    // Ensure root directory exists
    const fsExtra = require("fs-extra");
    fsExtra.ensureDirSync(rootDir);

    // Initialize connection pool (SQLite database)
    const dbPath = path.join(rootDir, "jumbo.db");
    this.connectionManager = new InternalConnectionManager(dbPath);

    // Initialize event store
    this.eventStore = new FsEventStore(rootDir);

    // Initialize event bus for pub/sub messaging
    this.eventBus = new InProcessEventBus();

    // Initialize clock for timestamp generation
    this.clock = new SystemClock();

    // Register signal handlers for automatic cleanup
    this.registerSignalHandlers();
  }

  /**
   * Registers process signal handlers for automatic resource cleanup.
   *
   * Handles:
   * - 'exit': Normal process termination
   * - 'SIGINT': Interrupt signal (Ctrl+C)
   * - 'SIGTERM': Termination signal (kill command)
   *
   * These handlers ensure resources are properly released even when
   * the process is terminated unexpectedly.
   */
  private registerSignalHandlers(): void {
    if (this.signalHandlersRegistered) {
      return;
    }

    const cleanup = () => {
      this.cleanup();
    };

    // Handle normal exit
    process.on("exit", cleanup);

    // Handle Ctrl+C
    process.on("SIGINT", () => {
      cleanup();
      process.exit(130); // Standard exit code for SIGINT
    });

    // Handle kill command
    process.on("SIGTERM", () => {
      cleanup();
      process.exit(143); // Standard exit code for SIGTERM
    });

    this.signalHandlersRegistered = true;
  }

  /**
   * Internal cleanup method - releases all resources.
   *
   * This method is idempotent and safe to call multiple times.
   * It is called automatically by signal handlers.
   */
  private cleanup(): void {
    if (this.disposed) {
      return;
    }

    this.connectionManager.internalDispose();
    this.disposed = true;
  }

  /**
   * Factory method to get the database connection manager.
   *
   * Returns the IDbConnectionManager interface, not the concrete implementation.
   * The returned interface provides access to the database connection but does
   * not expose disposal methods to external consumers in practice, since
   * lifecycle is managed internally.
   *
   * @returns IDbConnectionManager interface for database access
   */
  getConnectionManager(): IDbConnectionManager {
    return this.connectionManager;
  }

  /**
   * Factory method to get the database connection directly.
   *
   * Convenience method that returns the raw Database instance for cases
   * where direct database access is needed (e.g., projection stores).
   *
   * @returns Database connection instance
   */
  getConnection(): Database.Database {
    return this.connectionManager.getConnection();
  }

  /**
   * Factory method to get the event store.
   *
   * Returns the IEventStore interface for event persistence operations.
   * The event store uses file-based storage and does not require disposal.
   *
   * @returns IEventStore interface for event operations
   */
  getEventStore(): IEventStore {
    return this.eventStore;
  }

  /**
   * Factory method to get the event bus.
   *
   * Returns the IEventBus interface for pub/sub messaging.
   * The event bus enables decoupled communication between components.
   *
   * @returns IEventBus interface for event publishing and subscription
   */
  getEventBus(): IEventBus {
    return this.eventBus;
  }

  /**
   * Factory method to get the clock.
   *
   * Returns the IClock interface for timestamp generation.
   * Uses system clock in production, can be mocked in tests.
   *
   * @returns IClock interface for time operations
   */
  getClock(): IClock {
    return this.clock;
  }
}
