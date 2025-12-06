import { ResumeSessionCommand } from "./ResumeSessionCommand.js";
import { ISessionResumedEventWriter } from "./ISessionResumedEventWriter.js";
import { ISessionResumedEventReader } from "./ISessionResumedEventReader.js";
import { IEventBus } from "../../../shared/messaging/IEventBus.js";
import { Session } from "../../../../domain/work/sessions/Session.js";
import { SessionEvent } from "../../../../domain/work/sessions/EventIndex.js";

/**
 * Handles resuming a paused session.
 * Loads session from event history, produces SessionResumed event, persists and publishes.
 */
export class ResumeSessionCommandHandler {
  constructor(
    private readonly eventWriter: ISessionResumedEventWriter,
    private readonly eventReader: ISessionResumedEventReader,
    private readonly eventBus: IEventBus
  ) {}

  async execute(
    command: ResumeSessionCommand
  ): Promise<{ sessionId: string }> {
    // 1. Load event history
    const history = await this.eventReader.readStream(command.sessionId);

    if (history.length === 0) {
      throw new Error("No session found with the given ID");
    }

    // 2. Rehydrate aggregate from events
    const session = Session.rehydrate(command.sessionId, history as SessionEvent[]);

    // 3. Domain logic produces event
    const event = session.resume();

    // 4. Persist event to file store
    await this.eventWriter.append(event);

    // 5. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    return { sessionId: command.sessionId };
  }
}
