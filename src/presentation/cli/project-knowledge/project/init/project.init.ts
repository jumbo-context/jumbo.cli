/**
 * CLI Command: jumbo project init
 *
 * Initializes a new Jumbo project by creating the .jumbo/ directory
 * and recording the initial ProjectInitialized event.
 */

import path from "path";
import { CommandMetadata } from "../../../shared/registry/CommandMetadata.js";
import { ApplicationContainer } from "../../../../../infrastructure/composition/bootstrap.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Initialize a new Jumbo project with AI assistant hook configuration",
  category: "project-knowledge",
  requiredOptions: [
    {
      flags: "--name <name>",
      description: "Project name"
    }
  ],
  options: [
    {
      flags: "--tagline <tagline>",
      description: "Short project descriptor"
    },
    {
      flags: "--purpose <purpose>",
      description: "High-level project purpose"
    },
    {
      flags: "--boundary <boundary...>",
      description: "What's out of scope (can specify multiple)"
    }
  ],
  examples: [
    {
      command: 'jumbo project init --name "MyProject" --purpose "AI memory management"',
      description: "Initialize a new project with name and purpose"
    }
  ],
  related: ["project update"]
};
import fs from "fs-extra";
import { InitializeProjectCommandHandler } from "../../../../../application/project-knowledge/project/init/InitializeProjectCommandHandler.js";
import { ProjectInitializedEventHandler } from "../../../../../application/project-knowledge/project/init/ProjectInitializedEventHandler.js";
import { ProjectUpdatedEventHandler } from "../../../../../application/project-knowledge/project/update/ProjectUpdatedEventHandler.js";
import { InitializeProjectCommand } from "../../../../../application/project-knowledge/project/init/InitializeProjectCommand.js";
import { FsProjectInitializedEventStore } from "../../../../../infrastructure/project-knowledge/project/init/FsProjectInitializedEventStore.js";
import { SqliteConnectionManager } from "../../../../../infrastructure/shared/persistence/SqliteConnectionManager.js";
import { SqliteProjectInitializedProjector } from "../../../../../infrastructure/project-knowledge/project/init/SqliteProjectInitializedProjector.js";
import { SqliteProjectUpdatedProjector } from "../../../../../infrastructure/project-knowledge/project/update/SqliteProjectUpdatedProjector.js";
import { InProcessEventBus } from "../../../../../infrastructure/shared/messaging/InProcessEventBus.js";
import { Renderer } from "../../../shared/rendering/Renderer.js";
import { getBannerLines } from "../../../shared/components/AnimatedBanner.js";
import { AgentFileProtocol } from "../../../../../infrastructure/project-knowledge/project/init/AgentFileProtocol.js";

/**
 * Command handler
 * Called by Commander with parsed options
 *
 * Special case: Container is undefined for project init since .jumbo doesn't exist yet.
 * This command bootstraps the initial infrastructure.
 */
export async function projectInit(
  options: {
    name: string;
    tagline?: string;
    purpose?: string;
    boundary?: string[];
  },
  container?: ApplicationContainer
) {
  const jumboRoot = path.join(process.cwd(), ".jumbo");

  // Configure renderer for onboarding (always flashy/human-friendly)
  const renderer = Renderer.configure({ forceHuman: true });

  // Show welcome banner
  renderer.banner(getBannerLines());

  // Check if already initialized
  if (await fs.pathExists(jumboRoot)) {
    renderer.error(
      "Project already initialized. Use 'jumbo project update' to modify."
    );
    process.exit(1);
  }

  // Create .jumbo directory
  await fs.ensureDir(jumboRoot);

  // Project init creates its own infrastructure (container is undefined)
  let dbConnectionManager: SqliteConnectionManager | undefined;

  try {
    // 1. Create infrastructure implementations (no container available yet)
    const eventBus = new InProcessEventBus();
    const eventStore = new FsProjectInitializedEventStore(jumboRoot);
    dbConnectionManager = new SqliteConnectionManager(path.join(jumboRoot, "jumbo.db"));
    const db = dbConnectionManager.getConnection();
    const projectInitializedProjector = new SqliteProjectInitializedProjector(db);
    const projectUpdatedProjector = new SqliteProjectUpdatedProjector(db);

    // 2. Create application handlers (depend on abstractions)
    const projectInitializedHandler = new ProjectInitializedEventHandler(projectInitializedProjector);
    const projectUpdatedHandler = new ProjectUpdatedEventHandler(projectUpdatedProjector);
    const agentFileProtocol = new AgentFileProtocol();
    const commandHandler = new InitializeProjectCommandHandler(
      eventStore,
      eventBus,
      projectInitializedProjector,
      agentFileProtocol
    );

    // 3. Wire subscriptions (application handler subscribes to infrastructure event bus)
    eventBus.subscribe("ProjectInitialized", projectInitializedHandler);
    eventBus.subscribe("ProjectUpdated", projectUpdatedHandler);

    // 4. Execute command
    const command: InitializeProjectCommand = {
      name: options.name,
      tagline: options.tagline,
      purpose: options.purpose,
      boundaries: options.boundary,
    };

    const result = await commandHandler.execute(command, process.cwd());

    // Success output (verbose for onboarding)
    const data: Record<string, string> = {
      projectId: result.projectId,
      name: options.name,
    };
    if (options.tagline) {
      data.tagline = options.tagline;
    }
    if (options.purpose) {
      data.purpose = options.purpose;
    }

    renderer.success("Welcome to Jumbo! Project initialized successfully.", data);
    renderer.info("✓ Claude Code SessionStart hook configured (.claude/settings.json)");
    renderer.info("✓ Copilot instructions created (.github/copilot-instructions.md)");
    renderer.info("ℹ Gemini users: See AGENTS.md for manual setup instructions");
    renderer.info("");
    renderer.info("Next steps: Start a session with 'jumbo session start --focus \"<your focus>\"'");
  } catch (error) {
    // Clean up on failure
    await fs.remove(jumboRoot);
    throw error;
  } finally {
    // Project init manages its own cleanup (special case)
    if (dbConnectionManager) {
      await dbConnectionManager.dispose();
    }
  }
}
