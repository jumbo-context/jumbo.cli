import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { AppendResult } from "../../../shared/persistence/IEventStore.js";

/**
 * Port interface for writing AudienceRemoved events to the event store.
 * Used by RemoveAudienceCommandHandler to persist domain events.
 */
export interface IAudienceRemovedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
  readStream(aggregateId: string): Promise<BaseEvent[]>;
}
