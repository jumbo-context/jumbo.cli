import { GoalAddedEvent } from "../../../../domain/work/goals/add/GoalAddedEvent.js";

/**
 * Port interface for projecting GoalAddedEvent to the read model.
 * Used by GoalAddedEventHandler to update the projection store.
 */
export interface IGoalAddedProjector {
  applyGoalAdded(event: GoalAddedEvent): Promise<void>;
}
