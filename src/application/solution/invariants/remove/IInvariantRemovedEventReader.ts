import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";

/**
 * Port interface for reading invariant events to rehydrate aggregate.
 * Used by RemoveInvariantCommandHandler to load event history.
 */
export interface IInvariantRemovedEventReader {
  readStream(streamId: string): Promise<BaseEvent[]>;
}
