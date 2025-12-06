import { DependencyAdded } from "../../../../domain/solution/dependencies/add/DependencyAddedEvent.js";

/**
 * Port interface for projecting DependencyAddedEvent to the read model.
 * Used by DependencyAddedEventHandler to update the projection store.
 */
export interface IDependencyAddedProjector {
  applyDependencyAdded(event: DependencyAdded): Promise<void>;
}
