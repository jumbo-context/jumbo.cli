/**
 * CLI Command: jumbo db rebuild
 *
 * Rebuilds the materialized views (SQLite database) by replaying all events
 * from the event store. Useful for recovering from database corruption.
 */

import fs from "fs-extra";
import path from "path";
import { CommandMetadata } from "../../../shared/registry/CommandMetadata.js";
import { ApplicationContainer, bootstrap } from "../../../../../infrastructure/composition/bootstrap.js";
import { Renderer } from "../../../shared/rendering/Renderer.js";
import { RebuildDatabaseCommandHandler } from "../../../../../application/maintenance/db/rebuild/RebuildDatabaseCommandHandler.js";
import { RebuildDatabaseCommand } from "../../../../../application/maintenance/db/rebuild/RebuildDatabaseCommand.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Rebuild the database from the event store",
  options: [
    {
      flags: "--yes",
      description: "Skip confirmation prompt",
    },
  ],
  examples: [
    {
      command: "jumbo db rebuild",
      description: "Rebuild the database with confirmation prompt",
    },
    {
      command: "jumbo db rebuild --yes",
      description: "Rebuild the database without confirmation",
    },
  ],
  related: [],
};

interface RebuildOptions {
  yes?: boolean;
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function dbRebuild(options: RebuildOptions, container: ApplicationContainer) {
  const renderer = Renderer.getInstance();

  try {
    // Get jumbo root directory
    const jumboRoot = path.join(process.cwd(), ".jumbo");

    // Check if Jumbo is initialized
    if (!(await fs.pathExists(jumboRoot))) {
      renderer.error("Not in a Jumbo project", "Run 'jumbo project init' first");
      process.exit(1);
    }

    const dbPath = path.join(jumboRoot, "jumbo.db");

    // Confirm destructive operation
    if (!options.yes) {
      renderer.info(
        "⚠️  WARNING: This will delete and rebuild the database.\n" +
        "All materialized views will be reconstructed from the event store.\n"
      );
      renderer.error("Confirmation required", "Use --yes flag to proceed");
      process.exit(1);
    }

    renderer.info("Starting database rebuild...\n");

    // Step 1: Close existing database connection
    renderer.info("Closing database connection...");
    await container.dbConnectionManager.dispose();

    // Step 2: Delete the database file
    renderer.info("Deleting old database...");
    if (await fs.pathExists(dbPath)) {
      await fs.remove(dbPath);
    }

    // Step 3: Reinitialize container (creates new database with migrations)
    renderer.info("Reinitializing database...");
    const newContainer = bootstrap(jumboRoot);

    // Step 4: Replay all events
    renderer.info("Replaying events from event store...\n");
    const handler = new RebuildDatabaseCommandHandler(
      newContainer.eventStore,
      newContainer.eventBus
    );

    const command: RebuildDatabaseCommand = {
      skipConfirmation: true,
    };

    const result = await handler.handle(command);

    // Step 5: Cleanup new container
    await newContainer.dbConnectionManager.dispose();

    // Success output
    renderer.success("Database rebuilt successfully", {
      eventsReplayed: result.eventsReplayed,
    });
  } catch (error) {
    renderer.error(
      "Failed to rebuild database",
      error instanceof Error ? error : String(error)
    );
    process.exit(1);
  }
}
