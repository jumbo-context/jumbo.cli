import { IEventHandler } from "../../../shared/messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { ArchitectureDefined } from "../../../../domain/solution/architecture/define/ArchitectureDefinedEvent.js";
import { IArchitectureDefinedProjector } from "./IArchitectureDefinedProjector.js";

/**
 * Event handler for ArchitectureDefinedEvent.
 *
 * Application layer handler that orchestrates projection updates
 * when architecture is defined. Subscribes to ArchitectureDefinedEvent via event bus.
 */
export class ArchitectureDefinedEventHandler implements IEventHandler {
  constructor(private readonly projector: IArchitectureDefinedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const architectureDefinedEvent = event as ArchitectureDefined;
    await this.projector.applyArchitectureDefined(architectureDefinedEvent);
  }
}
