import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { AppendResult } from "../../../shared/persistence/IEventStore.js";

/**
 * Port interface for writing AudienceUpdated events to the event store.
 * Used by UpdateAudienceCommandHandler to persist domain events.
 */
export interface IAudienceUpdatedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
  readStream(aggregateId: string): Promise<BaseEvent[]>;
}
