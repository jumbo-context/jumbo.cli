/**
 * CLI Command: jumbo goal complete
 *
 * Marks a goal as completed (transitions status from 'doing' or 'blocked' to 'completed').
 */

import { CommandMetadata } from "../../../shared/registry/CommandMetadata.js";
import { ApplicationContainer } from "../../../../../infrastructure/composition/bootstrap.js";
import { Renderer } from "../../../shared/rendering/Renderer.js";
import { CompleteGoalCommandHandler } from "../../../../../application/work/goals/complete/CompleteGoalCommandHandler.js";
import { CompleteGoalCommand } from "../../../../../application/work/goals/complete/CompleteGoalCommand.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Mark a goal as completed",
  category: "work",
  requiredOptions: [
    {
      flags: "--goal-id <goalId>",
      description: "ID of the goal to complete"
    }
  ],
  examples: [
    {
      command: "jumbo goal complete --goal-id goal_abc123",
      description: "Complete a goal"
    }
  ],
  related: ["goal add", "goal start", "goal block"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalComplete(options: { goalId: string }, container: ApplicationContainer) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Create command handler
    const commandHandler = new CompleteGoalCommandHandler(
      container.goalCompletedEventStore,
      container.goalCompletedEventStore,
      container.goalCompletedProjector,
      container.eventBus
    );

    // 2. Execute command
    const command: CompleteGoalCommand = { goalId: options.goalId };
    const result = await commandHandler.execute(command);

    // 3. Fetch updated view for display
    const view = await container.goalCompletedProjector.findById(result.goalId);

    // Success output
    renderer.success("Goal completed", {
      goalId: result.goalId,
      objective: view?.objective || options.goalId,
      status: view?.status || 'completed'
    });
  } catch (error) {
    renderer.error("Failed to complete goal", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
