/**
 * CLI Command: jumbo project init
 *
 * Initializes a new Jumbo project by recording the initial ProjectInitialized event.
 * By default, runs in interactive mode prompting for each field.
 * Use --non-interactive flag to provide all values via command line options.
 */

import inquirer from "inquirer";
import { CommandMetadata } from "../../../shared/registry/CommandMetadata.js";
import { ApplicationContainer } from "../../../../../infrastructure/composition/bootstrap.js";
import { InitializeProjectCommand } from "../../../../../application/project-knowledge/project/init/InitializeProjectCommand.js";
import { InitializeProjectCommandHandler } from "../../../../../application/project-knowledge/project/init/InitializeProjectCommandHandler.js";
import { Renderer } from "../../../shared/rendering/Renderer.js";
import { getBannerLines } from "../../../shared/components/AnimatedBanner.js";
import { ProjectLimits } from "../../../../../domain/project-knowledge/project/Constants.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Initialize a new Jumbo project with AI assistant hook configuration",
  category: "project-knowledge",
  topLevelAliases: ["init"],
  options: [
    {
      flags: "--name <name>",
      description: "Project name (required in non-interactive mode)"
    },
    {
      flags: "--purpose <purpose>",
      description: "High-level project purpose"
    },
    {
      flags: "--boundary <boundary...>",
      description: "What's out of scope (can specify multiple)"
    },
    {
      flags: "--non-interactive",
      description: "Skip interactive prompts, use command line options only"
    }
  ],
  examples: [
    {
      command: "jumbo project init",
      description: "Initialize interactively (recommended)"
    },
    {
      command: 'jumbo project init --non-interactive --name "MyProject" --purpose "AI memory management"',
      description: "Initialize without prompts using command line options"
    }
  ],
  related: ["project update"],
  requiresProject: false
};

/**
 * Collected project initialization values
 */
interface ProjectInitOptions {
  name: string;
  purpose?: string;
  boundaries?: string[];
}

/**
 * Prompts the user interactively for project initialization values.
 * Each field includes explanatory text to guide the user.
 */
async function promptForProjectDetails(): Promise<ProjectInitOptions> {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "name",
      message: "Project name:",
      suffix: "\n  A short, memorable name for your project (e.g., 'MyApp', 'DataPipeline')\n>",
      validate: (input: string) => {
        if (!input.trim()) {
          return "Project name is required";
        }
        if (input.length > ProjectLimits.NAME_MAX_LENGTH) {
          return `Project name must be less than ${ProjectLimits.NAME_MAX_LENGTH} characters`;
        }
        return true;
      },
    },
    {
      type: "input",
      name: "purpose",
      message: "Purpose (optional):",
      suffix: "\n  The high-level goal or problem this project solves\n>",
      validate: (input: string) => {
        if (input && input.length > ProjectLimits.PURPOSE_MAX_LENGTH) {
          return `Purpose must be less than ${ProjectLimits.PURPOSE_MAX_LENGTH} characters`;
        }
        return true;
      },
    },
    {
      type: "input",
      name: "boundariesInput",
      message: "Boundaries (optional):",
      suffix: "\n  What's explicitly out of scope? Comma-separated list (e.g., 'mobile app, billing integration')\n>",
    },
  ]);

  // Parse boundaries from comma-separated input
  const boundaries = answers.boundariesInput
    ? answers.boundariesInput
        .split(",")
        .map((b: string) => b.trim())
        .filter((b: string) => b.length > 0)
    : undefined;

  return {
    name: answers.name.trim(),
    purpose: answers.purpose?.trim() || undefined,
    boundaries: boundaries?.length ? boundaries : undefined,
  };
}

/**
 * Command handler - receives container like all other controllers
 */
export async function projectInit(
  options: {
    name?: string;
    purpose?: string;
    boundary?: string[];
    nonInteractive?: boolean;
  },
  container: ApplicationContainer
) {
  // Configure renderer for onboarding (always flashy/human-friendly)
  const renderer = Renderer.configure({ forceHuman: true });

  // Show welcome banner
  renderer.banner(getBannerLines());

  // Determine project details based on mode
  let projectDetails: ProjectInitOptions;

  if (options.nonInteractive) {
    // Non-interactive mode: require --name flag
    if (!options.name) {
      renderer.error("Project name is required in non-interactive mode. Use --name <name>");
      process.exit(1);
    }
    projectDetails = {
      name: options.name,
      purpose: options.purpose,
      boundaries: options.boundary,
    };
  } else {
    // Interactive mode (default): prompt for all fields
    renderer.info("Let's set up your Jumbo project. Press Enter to skip optional fields.\n");
    projectDetails = await promptForProjectDetails();
  }

  // Create command handler from container dependencies
  const commandHandler = new InitializeProjectCommandHandler(
    container.projectInitializedEventStore,
    container.eventBus,
    container.projectInitializedProjector,
    container.agentFileProtocol
  );

  // Execute command
  const command: InitializeProjectCommand = {
    name: projectDetails.name,
    purpose: projectDetails.purpose,
    boundaries: projectDetails.boundaries,
  };

  const result = await commandHandler.execute(command, process.cwd());

  // Success output (verbose for onboarding)
  const data: Record<string, string> = {
    projectId: result.projectId,
    name: projectDetails.name,
  };
  if (projectDetails.purpose) {
    data.purpose = projectDetails.purpose;
  }

  renderer.success("Welcome to Jumbo! Project initialized successfully.", data);
  renderer.info("✓ Claude Code SessionStart hook configured (.claude/settings.json)");
  renderer.info("✓ Copilot instructions created (.github/copilot-instructions.md)");
  renderer.info("ℹ Gemini users: See AGENTS.md for manual setup instructions");
  renderer.info("");
  renderer.info("Next steps: Start a session with 'jumbo session start --focus \"<your focus>\"'");
}
