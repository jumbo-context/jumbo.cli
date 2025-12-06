import { BaseEvent } from "../../../shared/BaseEvent.js";
import { GoalStatusType } from "../Constants.js";

/**
 * Emitted when a defined goal is started (work begins).
 * Transitions goal status from "to-do" to "doing".
 */
export interface GoalStartedEvent extends BaseEvent {
  readonly type: "GoalStartedEvent";
  readonly payload: {
    readonly status: GoalStatusType; // "doing"
  };
}
