import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { AppendResult } from "../../../shared/persistence/IEventStore.js";

/**
 * Port interface for writing AudiencePainResolved events to the event store.
 * Used by ResolveAudiencePainCommandHandler to persist domain events.
 */
export interface IAudiencePainResolvedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
  readStream(aggregateId: string): Promise<BaseEvent[]>;
}
