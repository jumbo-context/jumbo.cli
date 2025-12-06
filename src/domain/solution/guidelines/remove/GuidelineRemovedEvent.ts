/**
 * GuidelineRemoved Event
 *
 * Emitted when a guideline is removed.
 * The guideline remains in the event store but is marked as removed in projections.
 */

import { BaseEvent, ISO8601 } from "../../../shared/BaseEvent.js";

export interface GuidelineRemoved extends BaseEvent {
  readonly type: "GuidelineRemoved";
  readonly payload: {
    readonly removedAt: ISO8601;
    readonly reason?: string;
  };
}
