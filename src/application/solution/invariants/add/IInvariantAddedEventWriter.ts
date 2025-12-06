import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { AppendResult } from "../../../shared/persistence/IEventStore.js";

/**
 * Port interface for writing InvariantAddedEvent to the event store.
 * Used by AddInvariantCommandHandler to persist domain events.
 */
export interface IInvariantAddedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
