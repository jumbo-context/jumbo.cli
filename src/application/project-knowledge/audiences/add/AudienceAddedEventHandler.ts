import { IEventHandler } from "../../../shared/messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { AudienceAdded } from "../../../../domain/project-knowledge/audiences/add/AudienceAddedEvent.js";
import { IAudienceAddedProjector } from "./IAudienceAddedProjector.js";

/**
 * Event handler for AudienceAdded event.
 *
 * Application layer handler that orchestrates projection updates
 * when a new audience is added. Subscribes to AudienceAdded via event bus.
 */
export class AudienceAddedEventHandler implements IEventHandler {
  constructor(private readonly projector: IAudienceAddedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const audienceAddedEvent = event as AudienceAdded;
    await this.projector.applyAudienceAdded(audienceAddedEvent);
  }
}
