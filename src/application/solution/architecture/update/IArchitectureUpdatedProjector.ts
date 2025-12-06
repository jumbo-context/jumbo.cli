import { ArchitectureUpdated } from "../../../../domain/solution/architecture/update/ArchitectureUpdatedEvent.js";

/**
 * Port interface for projecting ArchitectureUpdatedEvent to the read model.
 * Used by ArchitectureUpdatedEventHandler to update the projection store.
 */
export interface IArchitectureUpdatedProjector {
  applyArchitectureUpdated(event: ArchitectureUpdated): Promise<void>;
}
