import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";

/**
 * Port interface for reading goal events to rehydrate aggregate.
 * Used by UpdateGoalCommandHandler to load event history.
 */
export interface IGoalUpdatedEventReader {
  readStream(streamId: string): Promise<BaseEvent[]>;
}
