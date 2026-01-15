import { BaseEvent } from "../../../shared/BaseEvent.js";
import { GoalStatusType } from "../Constants.js";

/**
 * Emitted when a goal is resumed from paused status.
 * Transitions goal status from 'paused' to 'doing'.
 * Captures optional note about resumption.
 */
export interface GoalResumedEvent extends BaseEvent {
  readonly type: "GoalResumedEvent";
  readonly payload: {
    readonly status: GoalStatusType;     // Will be 'doing'
    readonly note?: string;              // Optional note about resumption
  };
}
