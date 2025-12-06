import { IEventHandler } from "../../../shared/messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { ArchitectureUpdated } from "../../../../domain/solution/architecture/update/ArchitectureUpdatedEvent.js";
import { IArchitectureUpdatedProjector } from "./IArchitectureUpdatedProjector.js";

/**
 * Event handler for ArchitectureUpdatedEvent.
 *
 * Application layer handler that orchestrates projection updates
 * when architecture is updated. Subscribes to ArchitectureUpdatedEvent via event bus.
 */
export class ArchitectureUpdatedEventHandler implements IEventHandler {
  constructor(private readonly projector: IArchitectureUpdatedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const architectureUpdatedEvent = event as ArchitectureUpdated;
    await this.projector.applyArchitectureUpdated(architectureUpdatedEvent);
  }
}
