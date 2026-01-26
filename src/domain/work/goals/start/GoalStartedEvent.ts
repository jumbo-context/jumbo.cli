import { BaseEvent } from "../../../shared/BaseEvent.js";
import { GoalEventType, GoalStatusType } from "../Constants.js";

/**
 * Emitted when a defined goal is started (work begins).
 * Transitions goal status from "to-do" to "doing".
 */
export interface GoalStartedEvent extends BaseEvent {
  readonly type: typeof GoalEventType.STARTED;
  readonly payload: {
    readonly status: GoalStatusType; // "doing"
  };
}
