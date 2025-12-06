/**
 * Port interface for projecting ValuePropositionAdded events.
 * Infrastructure layer will implement this.
 */

import { ValuePropositionAdded } from "../../../../domain/project-knowledge/value-propositions/add/ValuePropositionAddedEvent.js";

export interface IValuePropositionAddedProjector {
  /**
   * Applies a ValuePropositionAdded event to update the materialized view.
   */
  applyValuePropositionAdded(event: ValuePropositionAdded): Promise<void>;
}
