import { ComponentDeprecated } from "../../../../domain/solution/components/deprecate/ComponentDeprecatedEvent.js";

export interface IComponentDeprecatedProjector {
  applyComponentDeprecated(event: ComponentDeprecated): Promise<void>;
}
