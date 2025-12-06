import { IEventHandler } from "../../../shared/messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { ComponentRemoved } from "../../../../domain/solution/components/remove/ComponentRemovedEvent.js";
import { IComponentRemovedProjector } from "./IComponentRemovedProjector.js";

export class ComponentRemovedEventHandler implements IEventHandler {
  constructor(private readonly projector: IComponentRemovedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const componentRemovedEvent = event as ComponentRemoved;
    await this.projector.applyComponentRemoved(componentRemovedEvent);
  }
}
