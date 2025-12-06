/**
 * InvariantUpdated Event
 *
 * Emitted when an invariant's details are updated.
 */

import { BaseEvent } from "../../../shared/BaseEvent.js";

export interface InvariantUpdated extends BaseEvent {
  readonly type: "InvariantUpdated";
  readonly payload: {
    readonly title?: string;
    readonly description?: string;
    readonly rationale?: string | null;
    readonly enforcement?: string;
  };
}
