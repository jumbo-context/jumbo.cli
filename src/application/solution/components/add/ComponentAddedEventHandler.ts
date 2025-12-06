import { IEventHandler } from "../../../shared/messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { ComponentAdded } from "../../../../domain/solution/components/add/ComponentAddedEvent.js";
import { IComponentAddedProjector } from "./IComponentAddedProjector.js";

export class ComponentAddedEventHandler implements IEventHandler {
  constructor(private readonly projector: IComponentAddedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const componentAddedEvent = event as ComponentAdded;
    await this.projector.applyComponentAdded(componentAddedEvent);
  }
}
