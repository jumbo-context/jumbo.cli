import { DependencyUpdated } from "../../../../domain/solution/dependencies/update/DependencyUpdatedEvent.js";

/**
 * Port interface for projecting DependencyUpdatedEvent to the read model.
 * Used by DependencyUpdatedEventHandler to update the projection store.
 */
export interface IDependencyUpdatedProjector {
  applyDependencyUpdated(event: DependencyUpdated): Promise<void>;
}
