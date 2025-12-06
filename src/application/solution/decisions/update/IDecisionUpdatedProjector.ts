/**
 * Port interface for projecting DecisionUpdated events.
 * Infrastructure layer will implement this.
 */

import { DecisionUpdated } from "../../../../domain/solution/decisions/update/DecisionUpdatedEvent.js";

export interface IDecisionUpdatedProjector {
  /**
   * Applies a DecisionUpdated event to update the materialized view.
   */
  applyDecisionUpdated(event: DecisionUpdated): Promise<void>;
}
