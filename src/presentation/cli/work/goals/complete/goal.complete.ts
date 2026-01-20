/**
 * CLI Command: jumbo goal complete
 *
 * Handles goal completion requests.
 * - Without --commit: Triggers QA verification against goal criteria
 * - With --commit: Completes the goal and prompts for learnings
 */

import { CommandMetadata } from "../../../shared/registry/CommandMetadata.js";
import { ApplicationContainer } from "../../../composition/bootstrap.js";
import { Renderer } from "../../../shared/rendering/Renderer.js";
import { CompleteGoalRequest } from "../../../../../application/work/goals/complete/CompleteGoalRequest.js";
import { CompleteGoalResponse } from "../../../../../application/work/goals/complete/CompleteGoalResponse.js";
import { GoalContextFormatter } from "../start/GoalContextFormatter.js";
import { GoalStatus } from "../../../../../domain/work/goals/Constants.js";

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
  options: [
    {
      flags: "--commit",
      description: "Commit the goal completion",
      hidden: true
    }
  ],
  examples: [
    {
      command: "jumbo goal complete --goal-id goal_abc123",
      description: "Verify work against goal criteria"
    }
  ],
  related: ["goal add", "goal start", "goal block"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalComplete(
  options: { goalId: string; commit?: boolean },
  container: ApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Get controller from container
    const controller = container.completeGoalController;

    // 2. Create request
    const request: CompleteGoalRequest = {
      goalId: options.goalId,
      commit: options.commit || false,
    };

    // 3. Handle request
    const response = await controller.handle(request);

    // 4. Render response
    switch (response.status) {
      case GoalStatus.DOING:
      case GoalStatus.INREVIEW:
        renderQualityAssuranceContext(renderer, response);
        break;
      case GoalStatus.COMPLETED:
        renderCommittedContext(renderer, response);
        break;
      default:
        break;
    }
    renderer.divider();

  } catch (error) {
    renderer.error("Failed to process goal completion", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}

function renderCommittedContext(
  renderer: Renderer,
  response: CompleteGoalResponse
){
  // Render capture learning prompt
  renderer.headline("# Goal Completed - Capture Learnings");
  renderer.info("@LLM: Reflect briefly. Did this goal surface anything that future sessions MUST know?");
  renderer.info("Only propose additions if they are:");
  renderer.info("  • Universal (applies beyond this specific goal)");
  renderer.info("  • Dense (one sentence, no examples unless the example IS the rule)");
  renderer.info("  • Actionable (changes how code is written or decisions are made)");
  renderer.info("Capturable types: invariant, guideline, decision, component, dependency, architecture.");
  renderer.info("If nothing qualifies, say so. Avoid restating what's already captured.");
  renderer.info("Run 'jumbo --help' for command details.");
  
  // If next goal in chain
    if (response.nextGoal) {
    // Render next goal if present
      renderer.headline("## Next goal in chain:");
      renderer.data({
        goalId: response.nextGoal.goalId,
        objective: response.nextGoal.objective,
        status: response.nextGoal.status,
      });
      renderer.info("\nStart this goal without prompting (if you have permission). Run:");
      renderer.info(`  jumbo goal start --goal-id ${response.nextGoal.goalId}`);
    }

}

function renderQualityAssuranceContext(
  renderer: Renderer,
  response: CompleteGoalResponse
){
  // Render Headline
  renderer.headline("# Goal Completion Quality Assurance");
  renderer.info("@LLM: Review your work against the goal criteria below.");
  renderer.section("REQUIRED ACTIONS:");
  renderer.data({
    "1": "Verify each criterion is met, guideline followed, and invariant upheld",
    "2": "If any criterion is not met, guideline not followed, or invariant not upheld, then fix the issues immediately",
    "3": `Only run 'jumbo goal complete --goal-id ${response.goalId} --commit' after ALL criteria, guidelines, and invariants are satisfied`,
  });
  renderer.info("\nThis is a verification loop - you MUST ensure all criteria are met before committing.\n");
  // Render goal details
  renderer.headline("## Goal Details");
  renderer.data({ goalId: response.goalId, objective: response.objective, status: response.status });
 
  renderer.headline("## Success Criteria");

  // Render goal criteria
  let criteria = response.criteria
  if (criteria) {
    // Render criteria
    if (criteria.goal.successCriteria){
      renderer.headline("### Ensure your work fulfills these explicit criteria:");
      criteria.goal.successCriteria.forEach((element, i) => {
        renderer.data({ [`${i}`] : element});
      });
    }
    // Render files to be changed
    if (criteria.goal.filesToBeChanged){
      renderer.headline("### Ensure your work has changed only these files:");
      criteria.goal.filesToBeChanged.forEach((element, i) => {
        renderer.data({ [`${i}`] : element});
      });
    }
    // Render files to be created
    if (criteria.goal.filesToBeCreated){
      renderer.headline("### Ensure your work has created only these files:");
      criteria.goal.filesToBeCreated.forEach((element, i) => {
        renderer.data({ [`${i}`] : element});
      });
    }
    // Render boundaries
    if (criteria.goal.boundaries.length > 0){
      renderer.headline("### Ensure your work has not exceeded these boundaries:");
      criteria.goal.boundaries.forEach((element, i) => {
        renderer.data({ [`${i}`] : element});
      });
    }
    // Render relevant guidelines
    if (criteria.guidelines){
      renderer.headline("### Ensure your work has followed these guidelines:");
      criteria.guidelines.forEach((element, i) => {
        renderer.data({ [`${i}`] : element.description});
      });
    }
    // Render relevant invariants
    if (criteria.invariants){
      renderer.headline("### Ensure your work does not deviate from these invariants:");
      criteria.invariants.forEach((element, i) => {
        renderer.data({ [`${i}`] : element.description});
      });
    }
    // Render architecture
    if (criteria.architecture && criteria.architecture.description){
          renderer.headline("### Ensure your work fits these architectural details:");
          renderer.data({
            description: criteria.architecture.description,
            organization: criteria.architecture.organization,

          });
          renderer.headline("### Ensure your work follows these architectural patterns:");
          criteria.architecture.patterns?.forEach((element, i) => {

            renderer.data({ [`${i}`] : element});
          });
          renderer.headline("### Ensure your work matches these development principles:");
          criteria.architecture.principles?.forEach((element, i) => {

            renderer.data({ [`${i}`] : element});
          });
    }
    // Render relevant dependencies
    if (criteria.dependencies.length > 0){
      renderer.headline("### Ensure your work is consistent with these dependencies:");
      criteria.dependencies.forEach(dependency => {
        renderer.data({[`${dependency.name}`] : `Version: ${dependency.version}, Purpose: ${dependency.purpose}.`});
      });
    }
    // Render relevant components
    if (criteria.components.length > 0){
      renderer.headline("### Ensure your work aligns with these components:");
      criteria.components.forEach(component => {
        renderer.data({[`${component.name}`] : `Description: ${component.description}.`});
      });
    }
    // Render closing prompt
    renderer.section("ONLY IF ALL CRITERIA ARE MET:");
    renderer.info(`Run 'jumbo goal complete --goal-id ${response.goalId} --commit' after ALL criteria, guidelines, and invariants are satisfied`);
  }
}
