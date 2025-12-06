import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { AppendResult } from "../../../shared/persistence/IEventStore.js";

/**
 * Port interface for writing AudiencePainAdded events to the event store.
 * Used by AddAudiencePainCommandHandler to persist domain events.
 */
export interface IAudiencePainAddedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
