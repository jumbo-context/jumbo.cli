import { IEventHandler } from "../../../shared/messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { ComponentUpdated } from "../../../../domain/solution/components/update/ComponentUpdatedEvent.js";
import { IComponentUpdatedProjector } from "./IComponentUpdatedProjector.js";

export class ComponentUpdatedEventHandler implements IEventHandler {
  constructor(private readonly projector: IComponentUpdatedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const componentUpdatedEvent = event as ComponentUpdated;
    await this.projector.applyComponentUpdated(componentUpdatedEvent);
  }
}
