import { IEventHandler } from "../../../shared/messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { AudienceRemoved } from "../../../../domain/project-knowledge/audiences/remove/AudienceRemovedEvent.js";
import { IAudienceRemovedProjector } from "./IAudienceRemovedProjector.js";

/**
 * Event handler for AudienceRemoved event.
 *
 * Application layer handler that orchestrates projection updates
 * when an audience is removed. Subscribes to AudienceRemoved via event bus.
 */
export class AudienceRemovedEventHandler implements IEventHandler {
  constructor(private readonly projector: IAudienceRemovedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const audienceRemovedEvent = event as AudienceRemoved;
    await this.projector.applyAudienceRemoved(audienceRemovedEvent);
  }
}
