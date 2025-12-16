/**
 * CLI Command: jumbo goal add
 *
 * Defines a new goal aggregate with 'to-do' status.
 *
 * Usage:
 *   jumbo goal add --objective "..." --criteria "..." [--scope-in "..."] [--scope-out "..."] [--boundary "..."]
 *   jumbo goal add --interactive  (LLM-guided protocol)
 */

import { CommandMetadata } from "../../../shared/registry/CommandMetadata.js";
import { ApplicationContainer } from "../../../../../infrastructure/composition/bootstrap.js";
import { Renderer } from "../../../shared/rendering/Renderer.js";
import { AddGoalCommandHandler } from "../../../../../application/work/goals/add/AddGoalCommandHandler.js";
import { AddGoalCommand } from "../../../../../application/work/goals/add/AddGoalCommand.js";
import { InteractiveGoalProtocol } from "./InteractiveGoalProtocol.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Define a new goal with objective, success criteria, and scope",
  category: "work",
  requiredOptions: [],
  options: [
    {
      flags: "--interactive",
      description: "Output interactive protocol for LLM-guided goal creation"
    },
    {
      flags: "--objective <objective>",
      description: "The goal's objective or purpose (required unless --interactive)"
    },
    {
      flags: "--criteria <criteria...>",
      description: "Success criteria for the goal"
    },
    {
      flags: "--scope-in <components...>",
      description: "Components/modules in scope for this goal"
    },
    {
      flags: "--scope-out <components...>",
      description: "Components/modules explicitly out of scope"
    },
    {
      flags: "--boundary <boundaries...>",
      description: "Non-negotiable constraints or boundaries"
    },
    {
      flags: "--relevant-invariants <json>",
      description: "JSON array of relevant invariants [{title, description, rationale?}]"
    },
    {
      flags: "--relevant-guidelines <json>",
      description: "JSON array of relevant guidelines [{title, description, rationale?, examples?}]"
    },
    {
      flags: "--relevant-components <json>",
      description: "JSON array of relevant components [{name, responsibility}]"
    },
    {
      flags: "--relevant-dependencies <json>",
      description: "JSON array of relevant dependencies [{consumer, provider}]"
    },
    {
      flags: "--architecture <json>",
      description: "JSON object for architecture {description, organization, patterns?, principles?}"
    },
    {
      flags: "--files-to-create <files...>",
      description: "New files this goal will create"
    },
    {
      flags: "--files-to-change <files...>",
      description: "Existing files this goal will modify"
    }
  ],
  examples: [
    {
      command: "jumbo goal add --interactive",
      description: "Start interactive goal creation protocol"
    },
    {
      command: "jumbo goal add --objective \"Implement JWT auth\" --criteria \"Token generation\" \"Token validation\"",
      description: "Add a goal with success criteria"
    },
    {
      command: "jumbo goal add --objective \"Refactor UserService\" --scope-in UserService AuthMiddleware --scope-out AdminRoutes",
      description: "Add a goal with scope defined"
    }
  ],
  related: ["goal start", "goal complete", "goal update"]
};

export async function goalAdd(
  options: {
    interactive?: boolean;
    objective?: string;
    criteria?: string[];
    scopeIn?: string[];
    scopeOut?: string[];
    boundary?: string[];
    relevantInvariants?: string;
    relevantGuidelines?: string;
    relevantComponents?: string;
    relevantDependencies?: string;
    architecture?: string;
    filesToCreate?: string[];
    filesToChange?: string[];
  },
  container: ApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    // Interactive mode: output protocol and return
    if (options.interactive) {
      const protocol = new InteractiveGoalProtocol({
        componentReader: container.componentContextReader,
        guidelineReader: container.guidelineContextReader,
        invariantReader: container.invariantContextReader,
        decisionReader: container.decisionContextReader,
      });
      const output = await protocol.generate();
      renderer.info(output);
      return;
    }

    // Non-interactive mode: objective is required
    if (!options.objective) {
      renderer.error("Missing required option", new Error("--objective is required (or use --interactive for guided creation)"));
      process.exit(1);
    }

    // JSON parsing helper
    const parseJson = (jsonStr: string | undefined, fieldName: string) => {
      if (!jsonStr) return undefined;
      try {
        return JSON.parse(jsonStr);
      } catch {
        throw new Error(`Invalid JSON for ${fieldName}: ${jsonStr}`);
      }
    };

    // 1. Create command handler
    const commandHandler = new AddGoalCommandHandler(container.goalAddedEventStore, container.eventBus);

    // 2. Execute command (handler generates goalId)
    const command: AddGoalCommand = {
      objective: options.objective,
      successCriteria: options.criteria || [],
      scopeIn: options.scopeIn,
      scopeOut: options.scopeOut,
      boundaries: options.boundary,
      relevantInvariants: parseJson(options.relevantInvariants, "relevant-invariants"),
      relevantGuidelines: parseJson(options.relevantGuidelines, "relevant-guidelines"),
      relevantComponents: parseJson(options.relevantComponents, "relevant-components"),
      relevantDependencies: parseJson(options.relevantDependencies, "relevant-dependencies"),
      architecture: parseJson(options.architecture, "architecture"),
      filesToBeCreated: options.filesToCreate,
      filesToBeChanged: options.filesToChange,
    };

    const result = await commandHandler.execute(command);

    // Success output
    renderer.success("Goal defined", {
      goalId: result.goalId,
      objective: options.objective,
      status: "to-do"
    });
  } catch (error) {
    renderer.error("Failed to define goal", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
