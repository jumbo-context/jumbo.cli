import { ComponentRemoved } from "../../../../domain/solution/components/remove/ComponentRemovedEvent.js";

export interface IComponentRemovedProjector {
  applyComponentRemoved(event: ComponentRemoved): Promise<void>;
}
