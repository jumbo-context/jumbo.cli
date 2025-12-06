/**
 * CLI Command: jumbo goal add
 *
 * Defines a new goal aggregate with 'to-do' status.
 *
 * Usage:
 *   jumbo goal add --objective "..." --criteria "..." [--scope-in "..."] [--scope-out "..."] [--boundary "..."]
 */

import { CommandMetadata } from "../../../shared/registry/CommandMetadata.js";
import { ApplicationContainer } from "../../../../../infrastructure/composition/bootstrap.js";
import { Renderer } from "../../../shared/rendering/Renderer.js";
import { AddGoalCommandHandler } from "../../../../../application/work/goals/add/AddGoalCommandHandler.js";
import { AddGoalCommand } from "../../../../../application/work/goals/add/AddGoalCommand.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Define a new goal with objective, success criteria, and scope",
  category: "work",
  requiredOptions: [
    {
      flags: "--objective <objective>",
      description: "The goal's objective or purpose"
    }
  ],
  options: [
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
    }
  ],
  examples: [
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
    objective: string;
    criteria?: string[];
    scopeIn?: string[];
    scopeOut?: string[];
    boundary?: string[];
  },
  container: ApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Create command handler
    const commandHandler = new AddGoalCommandHandler(container.goalAddedEventStore, container.eventBus);

    // 2. Execute command (handler generates goalId)
    const command: AddGoalCommand = {
      objective: options.objective,
      successCriteria: options.criteria || [],
      scopeIn: options.scopeIn,
      scopeOut: options.scopeOut,
      boundaries: options.boundary
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
