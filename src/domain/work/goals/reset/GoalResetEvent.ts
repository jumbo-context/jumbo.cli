import { BaseEvent, UUID, ISO8601 } from "../../../shared/BaseEvent.js";
import { GoalStatusType } from "../Constants.js";

/**
 * Emitted when a goal is reset to 'to-do' status.
 * Can transition from any status (doing, blocked, completed) back to 'to-do'.
 */
export interface GoalResetEvent extends BaseEvent {
  readonly type: "GoalResetEvent";
  readonly aggregateId: UUID;
  readonly version: number;
  readonly timestamp: ISO8601;
  readonly payload: {
    readonly status: GoalStatusType;  // Will be 'to-do'
  };
}
