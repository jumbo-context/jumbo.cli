import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { AppendResult } from "../../../shared/persistence/IEventStore.js";

/**
 * Port interface for writing InvariantRemovedEvent to the event store.
 * Used by RemoveInvariantCommandHandler to persist domain events.
 */
export interface IInvariantRemovedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
