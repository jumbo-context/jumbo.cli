import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { AppendResult } from "../../../shared/persistence/IEventStore.js";

/**
 * Port interface for writing AudienceAdded events to the event store.
 * Used by AddAudienceCommandHandler to persist domain events.
 */
export interface IAudienceAddedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
