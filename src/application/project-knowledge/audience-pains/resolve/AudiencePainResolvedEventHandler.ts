import { IEventHandler } from "../../../shared/messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { AudiencePainResolved } from "../../../../domain/project-knowledge/audience-pains/resolve/AudiencePainResolvedEvent.js";
import { IAudiencePainResolvedProjector } from "./IAudiencePainResolvedProjector.js";

/**
 * Event handler for AudiencePainResolved event.
 *
 * Application layer handler that orchestrates projection updates
 * when an audience pain is resolved. Subscribes to AudiencePainResolved via event bus.
 */
export class AudiencePainResolvedEventHandler implements IEventHandler {
  constructor(private readonly projector: IAudiencePainResolvedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const audiencePainResolvedEvent = event as AudiencePainResolved;
    await this.projector.applyAudiencePainResolved(audiencePainResolvedEvent);
  }
}
