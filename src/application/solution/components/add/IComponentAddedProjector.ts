import { ComponentAdded } from "../../../../domain/solution/components/add/ComponentAddedEvent.js";

export interface IComponentAddedProjector {
  applyComponentAdded(event: ComponentAdded): Promise<void>;
}
