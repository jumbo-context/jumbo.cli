import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";

/**
 * Port interface for reading session events to rehydrate the aggregate.
 * Used by ResumeSessionCommandHandler to load event history.
 */
export interface ISessionResumedEventReader {
  readStream(aggregateId: string): Promise<BaseEvent[]>;
}
