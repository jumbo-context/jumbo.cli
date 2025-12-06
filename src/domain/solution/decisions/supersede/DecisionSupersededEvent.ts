/**
 * DecisionSuperseded Event
 *
 * Emitted when a decision is superseded by another decision.
 * Marks the decision as no longer applicable because it has been replaced.
 */

import { BaseEvent, UUID } from "../../../shared/BaseEvent.js";

export interface DecisionSuperseded extends BaseEvent {
  readonly type: "DecisionSuperseded";
  readonly payload: {
    readonly supersededBy: UUID;
  };
}
