import { GoalQualifiedEvent } from "../../../../domain/work/goals/qualify/GoalQualifiedEvent.js";

/**
 * Port interface for projecting GoalQualifiedEvent to the read model.
 * Used by GoalQualifiedEventHandler to update the projection store.
 */
export interface IGoalQualifiedProjector {
  applyGoalQualified(event: GoalQualifiedEvent): Promise<void>;
}
