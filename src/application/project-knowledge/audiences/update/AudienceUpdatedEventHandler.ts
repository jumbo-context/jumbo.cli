import { IEventHandler } from "../../../shared/messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { AudienceUpdated } from "../../../../domain/project-knowledge/audiences/update/AudienceUpdatedEvent.js";
import { IAudienceUpdatedProjector } from "./IAudienceUpdatedProjector.js";

/**
 * Event handler for AudienceUpdated event.
 *
 * Application layer handler that orchestrates projection updates
 * when an audience is updated. Subscribes to AudienceUpdated via event bus.
 */
export class AudienceUpdatedEventHandler implements IEventHandler {
  constructor(private readonly projector: IAudienceUpdatedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const audienceUpdatedEvent = event as AudienceUpdated;
    await this.projector.applyAudienceUpdated(audienceUpdatedEvent);
  }
}
