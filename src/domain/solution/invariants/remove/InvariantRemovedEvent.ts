/**
 * InvariantRemoved Event
 *
 * Emitted when an invariant is removed from project knowledge.
 * The invariant is no longer applicable or needed.
 */

import { BaseEvent, ISO8601 } from "../../../shared/BaseEvent.js";

export interface InvariantRemoved extends BaseEvent {
  readonly type: "InvariantRemoved";
  readonly payload: {
    readonly removedAt: ISO8601;
  };
}
