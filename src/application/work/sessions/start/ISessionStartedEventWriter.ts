import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { AppendResult } from "../../../shared/persistence/IEventStore.js";

/**
 * Port interface for writing SessionStarted event to the event store.
 * Used by StartSessionCommandHandler to persist domain events.
 */
export interface ISessionStartedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
