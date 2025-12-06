import { ArchitectureDefined } from "../../../../domain/solution/architecture/define/ArchitectureDefinedEvent.js";

/**
 * Port interface for projecting ArchitectureDefinedEvent to the read model.
 * Used by ArchitectureDefinedEventHandler to update the projection store.
 */
export interface IArchitectureDefinedProjector {
  applyArchitectureDefined(event: ArchitectureDefined): Promise<void>;
}
