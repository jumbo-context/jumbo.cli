import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";

/**
 * Port interface for reading session events to rehydrate the aggregate.
 * Used by PauseSessionCommandHandler to load event history.
 */
export interface ISessionPausedEventReader {
  readStream(aggregateId: string): Promise<BaseEvent[]>;
}
