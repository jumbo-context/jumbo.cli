import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";

/**
 * Port interface for reading goal events to rehydrate aggregate.
 * Used by ResetGoalCommandHandler to load event history.
 */
export interface IGoalResetEventReader {
  readStream(streamId: string): Promise<BaseEvent[]>;
}
