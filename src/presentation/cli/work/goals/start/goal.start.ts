/**
 * CLI Command: jumbo goal start
 *
 * Starts a defined goal (transitions status from 'to-do' to 'doing').
 */

import { CommandMetadata } from "../../../shared/registry/CommandMetadata.js";
import { ApplicationContainer } from "../../../composition/bootstrap.js";
import { Renderer } from "../../../shared/rendering/Renderer.js";
import { StartGoalCommandHandler } from "../../../../../application/work/goals/start/StartGoalCommandHandler.js";
import { StartGoalCommand } from "../../../../../application/work/goals/start/StartGoalCommand.js";
import { GetGoalContextQueryHandler } from "../../../../../application/work/goals/get-context/GetGoalContextQueryHandler.js";
import { GoalContextFormatter } from "./GoalContextFormatter.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Start a defined goal (transitions status from 'to-do' to 'doing')",
  category: "work",
  requiredOptions: [
    {
      flags: "--goal-id <goalId>",
      description: "ID of the goal to start"
    }
  ],
  examples: [
    {
      command: "jumbo goal start --goal-id goal_abc123",
      description: "Start working on a specific goal"
    }
  ],
  related: ["goal add", "goal complete", "goal block"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalStart(options: { goalId: string }, container: ApplicationContainer) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Create command handler
    const commandHandler = new StartGoalCommandHandler(
      container.goalStartedEventStore,
      container.goalStartedEventStore,
      container.goalStartedProjector,
      container.eventBus
    );

    // 2. Execute command
    const command: StartGoalCommand = { goalId: options.goalId };
    const result = await commandHandler.execute(command);

    // 3. Fetch updated view for display
    const view = await container.goalStartedProjector.findById(result.goalId);

    // 4. Query and render goal context
    const getGoalContext = new GetGoalContextQueryHandler(
      container.goalContextReader,
      container.componentContextReader,
      container.dependencyContextReader,
      container.decisionContextReader,
      container.invariantContextReader,
      container.guidelineContextReader,
      container.relationRemovedProjector
    );
    const goalContextFormatter = new GoalContextFormatter();

    const goalContext = await getGoalContext.execute(result.goalId);
    const contextYaml = goalContextFormatter.format(goalContext);

    // Display context to user
    renderer.info("\n" + contextYaml);

    renderer.info("---\n");

    // LLM Guidance
    const llmInstruction = [
      "@LLM: Goal context loaded. Work within scope and boundaries.",
      "YOUR ROLE: Proactively run jumbo commands to capture project memories as they surface.",
      "Run 'jumbo --help' to see what can be tracked, if you haven't already.",
    ];
    renderer.info(llmInstruction.join("\n") + "\n");

    // Success output
    renderer.success("Goal started", {
      goalId: result.goalId,
      objective: view?.objective || "",
      status: view?.status || "doing",
    });
  } catch (error) {
    renderer.error("Failed to start goal", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
