import { GoalSubmittedForReviewEvent } from "../../../../domain/work/goals/review/GoalSubmittedForReviewEvent.js";

/**
 * Port interface for projecting GoalSubmittedForReviewEvent to the read model.
 * Used by GoalSubmittedForReviewEventHandler to update the projection store.
 */
export interface IGoalSubmittedForReviewProjector {
  applyGoalSubmittedForReview(event: GoalSubmittedForReviewEvent): Promise<void>;
}
