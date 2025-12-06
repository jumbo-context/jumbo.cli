import { BaseEvent } from "../../../shared/BaseEvent.js";

/**
 * Emitted when a value proposition is removed from the project.
 */
export interface ValuePropositionRemoved extends BaseEvent {
  readonly type: "ValuePropositionRemoved";
  readonly payload: Record<string, never>; // Empty payload
}
