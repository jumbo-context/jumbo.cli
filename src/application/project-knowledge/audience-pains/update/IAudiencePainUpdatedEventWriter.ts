import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { AppendResult } from "../../../shared/persistence/IEventStore.js";

/**
 * Port interface for writing AudiencePainUpdated events to the event store.
 * Used by UpdateAudiencePainCommandHandler to persist domain events.
 */
export interface IAudiencePainUpdatedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
  readStream(aggregateId: string): Promise<BaseEvent[]>;
}
