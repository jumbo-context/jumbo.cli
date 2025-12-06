import { IEventHandler } from "../../../shared/messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { SessionPaused } from "../../../../domain/work/sessions/pause/SessionPausedEvent.js";
import { ISessionPausedProjector } from "./ISessionPausedProjector.js";

/**
 * Event handler for SessionPaused event.
 *
 * Application layer handler that orchestrates projection updates
 * when a session is paused. Subscribes to SessionPaused via event bus.
 */
export class SessionPausedEventHandler implements IEventHandler {
  constructor(private readonly projector: ISessionPausedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const sessionPausedEvent = event as SessionPaused;
    await this.projector.applySessionPaused(sessionPausedEvent);
  }
}
