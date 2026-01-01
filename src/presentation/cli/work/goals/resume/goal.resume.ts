/**
 * CLI Command: jumbo goal resume
 *
 * Resumes work on an in-progress goal by loading its full context.
 * This command is used when returning to work on a goal that's already
 * in 'doing' status - it renders the goal context without changing state.
 */

import { CommandMetadata } from "../../../shared/registry/CommandMetadata.js";
import { ApplicationContainer } from "../../../../../infrastructure/composition/bootstrap.js";
import { Renderer } from "../../../shared/rendering/Renderer.js";
import { GetGoalContextQueryHandler } from "../../../../../application/work/goals/get-context/GetGoalContextQueryHandler.js";
import { GoalContextFormatter } from "../start/GoalContextFormatter.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Resume work on an in-progress goal (loads goal context)",
  category: "work",
  requiredOptions: [
    {
      flags: "--goal-id <goalId>",
      description: "ID of the goal to resume"
    }
  ],
  examples: [
    {
      command: "jumbo goal resume --goal-id goal_abc123",
      description: "Resume working on a specific goal"
    }
  ],
  related: ["goal start", "goal show", "goal complete"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalResume(options: { goalId: string }, container: ApplicationContainer) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Query goal context
    const getGoalContext = new GetGoalContextQueryHandler(
      container.goalContextReader,
      container.componentContextReader,
      container.dependencyContextReader,
      container.decisionContextReader,
      container.invariantContextReader,
      container.guidelineContextReader,
      container.relationRemovedProjector
    );

    const goalContext = await getGoalContext.execute(options.goalId);

    // 2. Validate goal exists
    if (!goalContext.goal) {
      renderer.error("Goal not found", `No goal exists with ID: ${options.goalId}`);
      process.exit(1);
    }

    // 3. Validate goal is in 'doing' status
    if (goalContext.goal.status !== "doing") {
      renderer.error(
        "Goal is not in progress",
        `Goal status is '${goalContext.goal.status}'. Use 'jumbo goal start' for to-do goals or 'jumbo goal unblock' for blocked goals.`
      );
      process.exit(1);
    }

    // 4. Format and render goal context
    const goalContextFormatter = new GoalContextFormatter();
    const contextYaml = goalContextFormatter.format(goalContext);

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
    renderer.success("Goal resumed", {
      goalId: goalContext.goal.goalId,
      objective: goalContext.goal.objective,
      status: goalContext.goal.status,
    });
  } catch (error) {
    renderer.error("Failed to resume goal", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
