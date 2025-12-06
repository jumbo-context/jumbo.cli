import { IEventHandler } from "../../../shared/messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { DependencyUpdated } from "../../../../domain/solution/dependencies/update/DependencyUpdatedEvent.js";
import { IDependencyUpdatedProjector } from "./IDependencyUpdatedProjector.js";

/**
 * Event handler for DependencyUpdatedEvent.
 *
 * Application layer handler that orchestrates projection updates
 * when a dependency is updated. Subscribes to DependencyUpdatedEvent via event bus.
 */
export class DependencyUpdatedEventHandler implements IEventHandler {
  constructor(private readonly projector: IDependencyUpdatedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const dependencyUpdatedEvent = event as DependencyUpdated;
    await this.projector.applyDependencyUpdated(dependencyUpdatedEvent);
  }
}
