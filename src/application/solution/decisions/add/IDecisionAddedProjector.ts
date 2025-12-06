/**
 * Port interface for projecting DecisionAdded events.
 * Infrastructure layer will implement this.
 */

import { DecisionAdded } from "../../../../domain/solution/decisions/add/DecisionAddedEvent.js";

export interface IDecisionAddedProjector {
  /**
   * Applies a DecisionAdded event to update the materialized view.
   */
  applyDecisionAdded(event: DecisionAdded): Promise<void>;
}
