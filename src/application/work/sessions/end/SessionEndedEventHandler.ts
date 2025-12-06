import { IEventHandler } from "../../../shared/messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { SessionEnded } from "../../../../domain/work/sessions/end/SessionEndedEvent.js";
import { ISessionEndedProjector } from "./ISessionEndedProjector.js";

/**
 * Event handler for SessionEnded event.
 *
 * Application layer handler that orchestrates projection updates
 * when a session is ended. Subscribes to SessionEnded via event bus.
 */
export class SessionEndedEventHandler implements IEventHandler {
  constructor(private readonly projector: ISessionEndedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const sessionEndedEvent = event as SessionEnded;
    await this.projector.applySessionEnded(sessionEndedEvent);
  }
}
