import { ComponentUpdated } from "../../../../domain/solution/components/update/ComponentUpdatedEvent.js";

export interface IComponentUpdatedProjector {
  applyComponentUpdated(event: ComponentUpdated): Promise<void>;
}
