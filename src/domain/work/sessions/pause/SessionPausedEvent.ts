import { BaseEvent } from "../../../shared/BaseEvent.js";

/**
 * Emitted when a session is paused.
 * Session can be resumed later with SessionResumed.
 */
export interface SessionPaused extends BaseEvent {
  readonly type: "SessionPaused";
  readonly payload: {
    // Minimal payload - status transition only
  };
}
