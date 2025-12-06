import { GoalUpdatedEvent } from "../../../../domain/work/goals/update/GoalUpdatedEvent.js";

/**
 * Port interface for projecting GoalUpdatedEvent to the read model.
 * Used by GoalUpdatedEventHandler to update the projection store.
 */
export interface IGoalUpdatedProjector {
  applyGoalUpdated(event: GoalUpdatedEvent): Promise<void>;
}
