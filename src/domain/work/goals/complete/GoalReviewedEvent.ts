import { BaseEvent } from "../../../shared/BaseEvent.js";
import { GoalEventType } from "../Constants.js";

/**
 * Emitted when a goal completion is reviewed during the QA process.
 * Used to track the number of review iterations and enforce turn limits.
 * Does not change goal status - purely for tracking purposes.
 */
export interface GoalReviewedEvent extends BaseEvent {
  readonly type: typeof GoalEventType.REVIEWED;
  readonly payload: {
    readonly reviewedAt: string;  // ISO 8601 timestamp
    readonly turnNumber: number;    // The turn number for this review
  };
}
