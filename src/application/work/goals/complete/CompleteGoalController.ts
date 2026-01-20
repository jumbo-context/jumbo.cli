import { CompleteGoalRequest } from "./CompleteGoalRequest.js";
import { CompleteGoalResponse } from "./CompleteGoalResponse.js";
import { CompleteGoalCommandHandler } from "./CompleteGoalCommandHandler.js";
import { GetGoalContextQueryHandler } from "../get-context/GetGoalContextQueryHandler.js";
import { IGoalCompleteReader } from "./IGoalCompleteReader.js";
import { ReviewTurnTracker } from "./ReviewTurnTracker.js";
import { IGoalReviewedEventWriter } from "./IGoalReviewedEventWriter.js";
import { IGoalReviewedEventReader } from "./IGoalReviewedEventReader.js";
import { IEventBus } from "../../../shared/messaging/IEventBus.js";
import { Goal } from "../../../../domain/work/goals/Goal.js";

/**
 * CompleteGoalController
 *
 * Controller for goal completion requests (similar to HTTP request controller).
 * Routes requests based on policy (commit flag + turn limit) and returns structured responses.
 *
 * - QA Mode (commit=false): Returns criteria and QA prompt for verification, records QA attempt
 * - Commit Mode (commit=true): Delegates to CompleteGoalCommandHandler and returns learnings prompt
 */
export class CompleteGoalController {
  constructor(
    private readonly completeGoalCommandHandler: CompleteGoalCommandHandler,
    private readonly getGoalContextQueryHandler: GetGoalContextQueryHandler,
    private readonly goalReader: IGoalCompleteReader,
    private readonly turnTracker: ReviewTurnTracker,
    private readonly reviewEventWriter: IGoalReviewedEventWriter,
    private readonly goalEventReader: IGoalReviewedEventReader, // Use for full goal history
    private readonly eventBus: IEventBus
  ) {}

  async handle(request: CompleteGoalRequest): Promise<CompleteGoalResponse> {
    // Check if we should auto-commit due to turn limit
    const shouldAutoCommit = await this.turnTracker.shouldAutoCommit(request.goalId);
    const effectiveCommit = request.commit || shouldAutoCommit;

    if (effectiveCommit) {
      return this.handleCommit(request.goalId);
    } else {
      return this.handleQA(request.goalId);
    }
  }

  /**
   * Handle QA mode: Return criteria and QA prompt, record review
   */
  private async handleQA(goalId: string): Promise<CompleteGoalResponse> {
    // Get current goal view
    const goalView = await this.goalReader.findById(goalId);
    if (!goalView) {
      throw new Error(`Goal not found: ${goalId}`);
    }

    // Record review (before incrementing count for next turn)
    const currentTurnCount = await this.turnTracker.getCurrentTurnCount(goalId);
    const nextTurnNumber = currentTurnCount + 1;

    // Rehydrate goal to record review
    const history = await this.goalEventReader.readStream(goalId);
    const goal = Goal.rehydrate(goalId, history as any);
    const reviewEvent = goal.recordReview(nextTurnNumber);

    // Persist and publish review event
    await this.reviewEventWriter.append(reviewEvent);
    await this.eventBus.publish(reviewEvent);

    // Get full goal context (criteria, components, invariants, etc.)
    const goalContext = await this.getGoalContextQueryHandler.execute(goalId);

    // Calculate remaining turns (after recording this attempt)
    const remainingTurns = await this.turnTracker.getRemainingTurns(goalId);

    return {
      goalId,
      objective: goalView.objective,
      status: goalView.status,
      criteria: goalContext,
    };
  }

  /**
   * Handle Commit mode: Delegate to CompleteGoalCommandHandler and return learnings prompt
   * @param goalId - The goal ID to complete
   */
  private async handleCommit(
    goalId: string
  ): Promise<CompleteGoalResponse> {
    // Delegate to command handler (state change)
    await this.completeGoalCommandHandler.execute({ goalId });

    // Get updated goal view
    const goalView = await this.goalReader.findById(goalId);
    if (!goalView) {
      throw new Error(`Goal not found after completion: ${goalId}`);
    }

    // Check for next goal
    let nextGoal;
    if (goalView.nextGoalId) {
      const nextGoalView = await this.goalReader.findById(goalView.nextGoalId);
      if (nextGoalView) {
        nextGoal = {
          goalId: nextGoalView.goalId,
          objective: nextGoalView.objective,
          status: nextGoalView.status,
        };
      }
    }

    return {
      goalId,
      objective: goalView.objective,
      status: goalView.status,
      // No criteria in commit mode (token optimization)
      nextGoal,
    };
  }
}
