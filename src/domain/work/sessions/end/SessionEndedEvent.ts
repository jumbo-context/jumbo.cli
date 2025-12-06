import { BaseEvent } from "../../../shared/BaseEvent.js";

/**
 * Emitted when a session is ended.
 * Captures the final focus/summary of work accomplished.
 */
export interface SessionEnded extends BaseEvent {
  readonly type: "SessionEnded";
  readonly payload: {
    readonly focus: string;
    readonly summary: string | null;
  };
}
