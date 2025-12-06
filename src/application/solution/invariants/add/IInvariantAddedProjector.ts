import { InvariantAdded } from "../../../../domain/solution/invariants/add/InvariantAddedEvent.js";

/**
 * Port interface for projecting InvariantAddedEvent to the read model.
 * Used by InvariantAddedEventHandler to update the projection store.
 */
export interface IInvariantAddedProjector {
  applyInvariantAdded(event: InvariantAdded): Promise<void>;
}
