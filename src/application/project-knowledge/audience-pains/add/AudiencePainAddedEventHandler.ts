import { IEventHandler } from "../../../shared/messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { AudiencePainAdded } from "../../../../domain/project-knowledge/audience-pains/add/AudiencePainAddedEvent.js";
import { IAudiencePainAddedProjector } from "./IAudiencePainAddedProjector.js";

/**
 * Event handler for AudiencePainAdded event.
 *
 * Application layer handler that orchestrates projection updates
 * when a new audience pain is added. Subscribes to AudiencePainAdded via event bus.
 */
export class AudiencePainAddedEventHandler implements IEventHandler {
  constructor(private readonly projector: IAudiencePainAddedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const audiencePainAddedEvent = event as AudiencePainAdded;
    await this.projector.applyAudiencePainAdded(audiencePainAddedEvent);
  }
}
