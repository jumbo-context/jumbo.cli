import { IEventHandler } from "../../../shared/messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { AudiencePainUpdated } from "../../../../domain/project-knowledge/audience-pains/update/AudiencePainUpdatedEvent.js";
import { IAudiencePainUpdatedProjector } from "./IAudiencePainUpdatedProjector.js";

/**
 * Event handler for AudiencePainUpdated event.
 *
 * Application layer handler that orchestrates projection updates
 * when an audience pain is updated. Subscribes to AudiencePainUpdated via event bus.
 */
export class AudiencePainUpdatedEventHandler implements IEventHandler {
  constructor(private readonly projector: IAudiencePainUpdatedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const audiencePainUpdatedEvent = event as AudiencePainUpdated;
    await this.projector.applyAudiencePainUpdated(audiencePainUpdatedEvent);
  }
}
