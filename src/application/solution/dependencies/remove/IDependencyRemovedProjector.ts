import { DependencyRemoved } from "../../../../domain/solution/dependencies/remove/DependencyRemovedEvent.js";

/**
 * Port interface for projecting DependencyRemovedEvent to the read model.
 * Used by DependencyRemovedEventHandler to update the projection store.
 */
export interface IDependencyRemovedProjector {
  applyDependencyRemoved(event: DependencyRemoved): Promise<void>;
}
