/**
 * InvariantAdded Event
 *
 * Emitted when an invariant is added to the project.
 * Invariants are non-negotiable requirements or boundaries.
 */

import { BaseEvent } from "../../../shared/BaseEvent.js";

export interface InvariantAdded extends BaseEvent {
  readonly type: "InvariantAdded";
  readonly payload: {
    readonly title: string;
    readonly description: string;
    readonly rationale: string | null;
    readonly enforcement: string;
  };
}
