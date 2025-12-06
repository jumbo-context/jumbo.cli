import { IEventHandler } from "../../../shared/messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { DependencyRemoved } from "../../../../domain/solution/dependencies/remove/DependencyRemovedEvent.js";
import { IDependencyRemovedProjector } from "./IDependencyRemovedProjector.js";

/**
 * Event handler for DependencyRemovedEvent.
 *
 * Application layer handler that orchestrates projection updates
 * when a dependency is removed. Subscribes to DependencyRemovedEvent via event bus.
 */
export class DependencyRemovedEventHandler implements IEventHandler {
  constructor(private readonly projector: IDependencyRemovedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const dependencyRemovedEvent = event as DependencyRemoved;
    await this.projector.applyDependencyRemoved(dependencyRemovedEvent);
  }
}
