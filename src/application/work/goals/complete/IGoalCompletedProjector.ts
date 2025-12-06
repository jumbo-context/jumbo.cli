import { GoalCompletedEvent } from "../../../../domain/work/goals/complete/GoalCompletedEvent.js";

/**
 * Port interface for projecting GoalCompletedEvent to the read model.
 * Used by GoalCompletedEventHandler to update the projection store.
 */
export interface IGoalCompletedProjector {
  applyGoalCompleted(event: GoalCompletedEvent): Promise<void>;
}
