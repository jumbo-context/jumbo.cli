import { BaseEvent } from "../../../shared/BaseEvent.js";

/**
 * Emitted when a goal's properties are updated.
 * Only fields provided in payload are updated; omitted fields remain unchanged.
 */
export interface GoalUpdatedEvent extends BaseEvent {
  readonly type: "GoalUpdatedEvent";
  readonly payload: {
    readonly objective?: string;
    readonly successCriteria?: string[];
    readonly scopeIn?: string[];
    readonly scopeOut?: string[];
    readonly boundaries?: string[];
  };
}
