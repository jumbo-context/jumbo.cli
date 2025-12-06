import { InvariantUpdated } from "../../../../domain/solution/invariants/update/InvariantUpdatedEvent.js";

/**
 * Port interface for projecting InvariantUpdatedEvent to the read model.
 * Used by InvariantUpdatedEventHandler to update the projection store.
 */
export interface IInvariantUpdatedProjector {
  applyInvariantUpdated(event: InvariantUpdated): Promise<void>;
}
