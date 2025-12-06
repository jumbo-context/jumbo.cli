import { PauseSessionCommand } from "./PauseSessionCommand.js";
import { ISessionPausedEventWriter } from "./ISessionPausedEventWriter.js";
import { ISessionPausedEventReader } from "./ISessionPausedEventReader.js";
import { IEventBus } from "../../../shared/messaging/IEventBus.js";
import { Session } from "../../../../domain/work/sessions/Session.js";
import { SessionEvent } from "../../../../domain/work/sessions/EventIndex.js";

/**
 * Handles pausing an active session.
 * Loads session from event history, produces SessionPaused event, persists and publishes.
 */
export class PauseSessionCommandHandler {
  constructor(
    private readonly eventWriter: ISessionPausedEventWriter,
    private readonly eventReader: ISessionPausedEventReader,
    private readonly eventBus: IEventBus
  ) {}

  async execute(
    command: PauseSessionCommand
  ): Promise<{ sessionId: string }> {
    // 1. Load event history
    const history = await this.eventReader.readStream(command.sessionId);

    if (history.length === 0) {
      throw new Error("No session found with the given ID");
    }

    // 2. Rehydrate aggregate from events
    const session = Session.rehydrate(command.sessionId, history as SessionEvent[]);

    // 3. Domain logic produces event
    const event = session.pause();

    // 4. Persist event to file store
    await this.eventWriter.append(event);

    // 5. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    return { sessionId: command.sessionId };
  }
}
