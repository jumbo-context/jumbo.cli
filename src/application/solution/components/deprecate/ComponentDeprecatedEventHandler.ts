import { IEventHandler } from "../../../shared/messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { ComponentDeprecated } from "../../../../domain/solution/components/deprecate/ComponentDeprecatedEvent.js";
import { IComponentDeprecatedProjector } from "./IComponentDeprecatedProjector.js";

export class ComponentDeprecatedEventHandler implements IEventHandler {
  constructor(private readonly projector: IComponentDeprecatedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const componentDeprecatedEvent = event as ComponentDeprecated;
    await this.projector.applyComponentDeprecated(componentDeprecatedEvent);
  }
}
