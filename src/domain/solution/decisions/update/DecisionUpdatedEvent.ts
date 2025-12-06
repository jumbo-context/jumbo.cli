/**
 * DecisionUpdated Event
 *
 * Emitted when a decision's properties are updated.
 */

import { BaseEvent } from "../../../shared/BaseEvent.js";

export interface DecisionUpdated extends BaseEvent {
  readonly type: "DecisionUpdated";
  readonly payload: {
    readonly title?: string;
    readonly context?: string;
    readonly rationale?: string;
    readonly alternatives?: string[];
    readonly consequences?: string;
  };
}
