import { IEventHandler } from "../../../shared/messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { SessionStarted } from "../../../../domain/work/sessions/start/SessionStartedEvent.js";
import { ISessionStartedProjector } from "./ISessionStartedProjector.js";

/**
 * Event handler for SessionStarted event.
 *
 * Application layer handler that orchestrates projection updates
 * when a session is started. Subscribes to SessionStarted via event bus.
 */
export class SessionStartedEventHandler implements IEventHandler {
  constructor(private readonly projector: ISessionStartedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const sessionStartedEvent = event as SessionStarted;
    await this.projector.applySessionStarted(sessionStartedEvent);
  }
}
