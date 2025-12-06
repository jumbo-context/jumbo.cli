/**
 * Port interface for projecting DecisionReversed events.
 * Infrastructure layer will implement this.
 */

import { DecisionReversed } from "../../../../domain/solution/decisions/reverse/DecisionReversedEvent.js";

export interface IDecisionReversedProjector {
  /**
   * Applies a DecisionReversed event to update the materialized view.
   */
  applyDecisionReversed(event: DecisionReversed): Promise<void>;
}
