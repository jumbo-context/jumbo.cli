/**
 * CLI Command: jumbo goal review
 *
 * Submits a goal for QA review.
 * Transitions goal from 'doing' to 'in-review' status and renders QA criteria.
 */

import { CommandMetadata } from "../../../shared/registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../shared/rendering/Renderer.js";
import { ReviewGoalRequest } from "../../../../../application/work/goals/review/ReviewGoalRequest.js";
import { ReviewGoalResponse } from "../../../../../application/work/goals/review/ReviewGoalResponse.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Submit a goal for QA review",
  category: "work",
  requiredOptions: [
    {
      flags: "--goal-id <goalId>",
      description: "ID of the goal to submit for review"
    }
  ],
  options: [],
  examples: [
    {
      command: "jumbo goal review --goal-id goal_abc123",
      description: "Submit a goal for QA review"
    }
  ],
  related: ["goal start", "goal complete", "goal pause"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalReview(
  options: { goalId: string },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Get controller from container
    const controller = container.reviewGoalController;

    // 2. Create request
    const request: ReviewGoalRequest = {
      goalId: options.goalId,
    };

    // 3. Handle request
    const response = await controller.handle(request);

    // 4. Render review context with QA criteria
    renderReviewContext(renderer, response);
    renderer.divider();

  } catch (error) {
    renderer.error("Failed to submit goal for review", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}

/**
 * Render the review context with QA criteria for verification
 */
function renderReviewContext(
  renderer: Renderer,
  response: ReviewGoalResponse
) {
  const criteria = response.criteria;
  const goal = criteria.goal;

  // Header
  renderer.headline("# Goal Review - QA Verification");
  renderer.info(`Goal ID: ${response.goalId}`);
  renderer.info(`Objective: ${response.objective}`);
  renderer.info(`Status: ${response.status}`);
  renderer.divider();

  // QA Instructions
  renderer.headline("## QA Instructions");
  renderer.info("@LLM: You are now in QA mode. Verify the implementation against the criteria below.");
  renderer.info("For each criterion, verify it has been met. Report any failures.");
  renderer.divider();

  // Success Criteria - Primary QA focus
  renderer.headline("## Success Criteria (VERIFY EACH):");
  goal.successCriteria.forEach((criterion, index) => {
    renderer.info(`  ${index + 1}. [ ] ${criterion}`);
  });
  renderer.info("\nINSTRUCTION: Each criterion above MUST be verified. Mark as [x] when verified or report failure.");
  renderer.divider();

  // Files to verify
  if (goal.filesToBeCreated && goal.filesToBeCreated.length > 0) {
    renderer.headline("## Files That Should Have Been Created:");
    goal.filesToBeCreated.forEach((file) => {
      renderer.info(`  - [ ] ${file}`);
    });
    renderer.info("\nINSTRUCTION: Verify each file exists and contains appropriate content.");
  }

  if (goal.filesToBeChanged && goal.filesToBeChanged.length > 0) {
    renderer.headline("## Files That Should Have Been Changed:");
    goal.filesToBeChanged.forEach((file) => {
      renderer.info(`  - [ ] ${file}`);
    });
    renderer.info("\nINSTRUCTION: Verify each file has been appropriately modified.");
  }

  // Scope verification
  if (goal.scopeIn && goal.scopeIn.length > 0) {
    renderer.headline("## Scope - Should Be Addressed:");
    goal.scopeIn.forEach((item) => {
      renderer.info(`  - ${item}`);
    });
  }

  if (goal.scopeOut && goal.scopeOut.length > 0) {
    renderer.headline("## Scope - Should NOT Be Touched:");
    goal.scopeOut.forEach((item) => {
      renderer.info(`  - ${item}`);
    });
    renderer.info("\nINSTRUCTION: Verify no changes were made to out-of-scope items.");
  }

  // Boundaries verification
  if (goal.boundaries && goal.boundaries.length > 0) {
    renderer.headline("## Boundaries (Must Not Exceed):");
    goal.boundaries.forEach((boundary) => {
      renderer.info(`  - ${boundary}`);
    });
  }

  // Invariants - must be respected
  if (criteria.invariants.length > 0) {
    renderer.headline("## Invariants (Must Be Respected):");
    criteria.invariants.forEach((inv) => {
      renderer.info(`  - ${inv.category}: ${inv.description}`);
    });
    renderer.info("\nINSTRUCTION: Verify implementation adheres to all invariants.");
  }

  // Guidelines - should be followed
  if (criteria.guidelines.length > 0) {
    renderer.headline("## Guidelines (Should Be Followed):");
    criteria.guidelines.forEach((g) => {
      renderer.info(`  - ${g.category}: ${g.description}`);
    });
  }

  // Final instructions
  renderer.divider();
  renderer.headline("## Next Steps");
  renderer.info("If ALL criteria are met:");
  renderer.info(`  Run: jumbo goal complete --goal-id ${response.goalId}`);
  renderer.info("\nIf ANY criteria are NOT met:");
  renderer.info("  Fix the issues and run: jumbo goal review --goal-id " + response.goalId + " again");
  renderer.info("---\n");
}
