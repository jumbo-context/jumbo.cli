import { BaseEvent } from "../../../shared/BaseEvent.js";

/**
 * Emitted when a paused session is resumed.
 * Session transitions from 'paused' to 'active' status.
 */
export interface SessionResumed extends BaseEvent {
  readonly type: "SessionResumed";
  readonly payload: {
    // Minimal payload - status transition only
  };
}
