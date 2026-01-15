import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";

/**
 * Port interface for reading goal events to rehydrate aggregate.
 * Used by PauseGoalCommandHandler to load event history.
 */
export interface IGoalPausedEventReader {
  readStream(streamId: string): Promise<BaseEvent[]>;
}
