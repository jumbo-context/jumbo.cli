import { BaseEvent } from "../../../shared/BaseEvent.js";

/**
 * Emitted when a developer starts a new working session.
 * This is the first event in the Session aggregate's lifecycle.
 * Focus is not captured at session start - it's captured at session end as a summary.
 */
export interface SessionStarted extends BaseEvent {
  readonly type: "SessionStarted";
  readonly payload: Record<string, never>; // No payload - session start has no parameters
}
