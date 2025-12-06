import { IEventHandler } from "../../../shared/messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { SessionResumed } from "../../../../domain/work/sessions/resume/SessionResumedEvent.js";
import { ISessionResumedProjector } from "./ISessionResumedProjector.js";

/**
 * Event handler for SessionResumed event.
 *
 * Application layer handler that orchestrates projection updates
 * when a session is resumed. Subscribes to SessionResumed via event bus.
 */
export class SessionResumedEventHandler implements IEventHandler {
  constructor(private readonly projector: ISessionResumedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const sessionResumedEvent = event as SessionResumed;
    await this.projector.applySessionResumed(sessionResumedEvent);
  }
}
