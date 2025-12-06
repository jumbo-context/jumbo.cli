/**
 * Port interface for projecting ValuePropositionRemoved events.
 * Infrastructure layer will implement this.
 */

import { ValuePropositionRemoved } from "../../../../domain/project-knowledge/value-propositions/remove/ValuePropositionRemovedEvent.js";

export interface IValuePropositionRemovedProjector {
  /**
   * Applies a ValuePropositionRemoved event to update the materialized view.
   */
  applyValuePropositionRemoved(event: ValuePropositionRemoved): Promise<void>;
}
