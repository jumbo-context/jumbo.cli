import { BaseEvent } from "../../../shared/BaseEvent.js";
import { GoalStatusType } from "../Constants.js";

/**
 * Emitted when a new goal is defined.
 * This is the first event in the Goal aggregate's lifecycle.
 * Goal starts in 'to-do' status.
 */
export interface GoalAddedEvent extends BaseEvent {
  readonly type: "GoalAddedEvent";
  readonly payload: {
    readonly objective: string;
    readonly successCriteria: string[];
    readonly scopeIn: string[];
    readonly scopeOut: string[];
    readonly boundaries: string[];
    readonly status: GoalStatusType;
  };
}
