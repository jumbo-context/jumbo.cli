/**
 * CLI Command: jumbo goal update
 *
 * Updates properties of an existing goal.
 * Only provided fields are updated; omitted fields remain unchanged.
 *
 * Usage:
 *   jumbo goal update <goalId> [--objective "..."] [--criteria "..."] [--scope-in "..."] [--scope-out "..."] [--boundary "..."]
 */

import { CommandMetadata } from "../../../shared/registry/CommandMetadata.js";
import { ApplicationContainer } from "../../../../../infrastructure/composition/bootstrap.js";
import { Renderer } from "../../../shared/rendering/Renderer.js";
import { UpdateGoalCommandHandler } from "../../../../../application/work/goals/update/UpdateGoalCommandHandler.js";
import { UpdateGoalCommand } from "../../../../../application/work/goals/update/UpdateGoalCommand.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Update an existing goal's properties (partial updates supported)",
  category: "work",
  requiredOptions: [
    {
      flags: "--goal-id <goalId>",
      description: "ID of the goal to update"
    }
  ],
  options: [
    {
      flags: "--objective <text>",
      description: "Updated objective"
    },
    {
      flags: "--criteria <items...>",
      description: "Updated success criteria (can specify multiple)"
    },
    {
      flags: "--scope-in <items...>",
      description: "Updated in-scope items"
    },
    {
      flags: "--scope-out <items...>",
      description: "Updated out-of-scope items"
    },
    {
      flags: "--boundary <items...>",
      description: "Updated boundaries"
    }
  ],
  examples: [
    {
      command: "jumbo goal update --goal-id goal_abc123 --objective \"Updated goal\"",
      description: "Update a goal's objective only"
    },
    {
      command: "jumbo goal update --goal-id goal_abc123 --criteria \"Criterion 1\" --criteria \"Criterion 2\"",
      description: "Update success criteria only"
    },
    {
      command: "jumbo goal update --goal-id goal_abc123 --objective \"New objective\" --scope-in \"Component A\"",
      description: "Update multiple fields at once"
    }
  ],
  related: ["goal add", "goal start", "goal complete"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalUpdate(
  options: {
    goalId: string;
    objective?: string;
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
    const commandHandler = new UpdateGoalCommandHandler(
      container.goalUpdatedEventStore,
      container.goalUpdatedEventStore,
      container.goalUpdatedProjector,
      container.eventBus
    );

    // 2. Build and execute command
    const command: UpdateGoalCommand = {
      goalId: options.goalId,
      objective: options.objective,
      successCriteria: options.criteria,
      scopeIn: options.scopeIn,
      scopeOut: options.scopeOut,
      boundaries: options.boundary,
    };

    const result = await commandHandler.execute(command);

    // Success output
    renderer.success("Goal updated", {
      goalId: result.goalId
    });
  } catch (error) {
    renderer.error("Failed to update goal", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
