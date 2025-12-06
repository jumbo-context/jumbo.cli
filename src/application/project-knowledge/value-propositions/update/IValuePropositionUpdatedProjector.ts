/**
 * Port interface for projecting ValuePropositionUpdated events.
 * Infrastructure layer will implement this.
 */

import { ValuePropositionUpdated } from "../../../../domain/project-knowledge/value-propositions/update/ValuePropositionUpdatedEvent.js";

export interface IValuePropositionUpdatedProjector {
  /**
   * Applies a ValuePropositionUpdated event to update the materialized view.
   */
  applyValuePropositionUpdated(event: ValuePropositionUpdated): Promise<void>;
}
