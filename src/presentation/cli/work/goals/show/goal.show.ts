/**
 * CLI Command: jumbo goal show
 *
 * Displays full goal details including objective, status, success criteria,
 * scope, boundaries, and notes.
 */

import { CommandMetadata } from "../../../shared/registry/CommandMetadata.js";
import { ApplicationContainer } from "../../../composition/bootstrap.js";
import { Renderer } from "../../../shared/rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Display full goal details",
  category: "work",
  requiredOptions: [
    {
      flags: "--goal-id <goalId>",
      description: "ID of the goal to show"
    }
  ],
  examples: [
    {
      command: "jumbo goal show --goal-id goal_abc123",
      description: "Show complete goal details"
    }
  ],
  related: ["goal add", "goal start", "goal update", "goal complete"]
};

/**
 * Format status with visual indicator
 */
function formatStatus(status: string): string {
  switch (status) {
    case "doing":
      return "doing (in progress)";
    case "blocked":
      return "blocked";
    case "to-do":
      return "to-do (planned)";
    case "done":
      return "done (completed)";
    default:
      return status;
  }
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalShow(
  options: { goalId: string },
  container: ApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    // Query goal by ID
    const goal = await container.goalContextReader.findById(options.goalId);

    if (!goal) {
      renderer.error("Goal not found", `No goal exists with ID: ${options.goalId}`);
      process.exit(1);
    }

    // For TTY (human): display formatted text
    // For pipe/file (machine): output structured JSON
    if (process.stdout.isTTY) {
      console.log("\n=== Goal Details ===\n");
      console.log(`Goal ID:    ${goal.goalId}`);
      console.log(`Objective:  ${goal.objective}`);
      console.log(`Status:     ${formatStatus(goal.status)}`);
      console.log(`Version:    ${goal.version}`);
      console.log(`Created:    ${goal.createdAt}`);
      console.log(`Updated:    ${goal.updatedAt}`);

      if (goal.note) {
        console.log(`\nNote:\n  ${goal.note}`);
      }

      if (goal.successCriteria.length > 0) {
        console.log("\nSuccess Criteria:");
        for (const criterion of goal.successCriteria) {
          console.log(`  - ${criterion}`);
        }
      }

      if (goal.scopeIn.length > 0 || goal.scopeOut.length > 0) {
        console.log("\nScope:");
        if (goal.scopeIn.length > 0) {
          console.log("  In:");
          for (const item of goal.scopeIn) {
            console.log(`    - ${item}`);
          }
        }
        if (goal.scopeOut.length > 0) {
          console.log("  Out:");
          for (const item of goal.scopeOut) {
            console.log(`    - ${item}`);
          }
        }
      }

      if (goal.boundaries.length > 0) {
        console.log("\nBoundaries:");
        for (const boundary of goal.boundaries) {
          console.log(`  - ${boundary}`);
        }
      }

      if (goal.nextGoalId) {
        console.log(`\nNext Goal:  ${goal.nextGoalId}`);
      }

      console.log("");
    } else {
      // Structured output for programmatic consumers
      renderer.data({
        goalId: goal.goalId,
        objective: goal.objective,
        successCriteria: goal.successCriteria,
        scopeIn: goal.scopeIn,
        scopeOut: goal.scopeOut,
        boundaries: goal.boundaries,
        status: goal.status,
        version: goal.version,
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt,
        note: goal.note,
        nextGoalId: goal.nextGoalId
      });
    }
  } catch (error) {
    renderer.error("Failed to show goal", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
