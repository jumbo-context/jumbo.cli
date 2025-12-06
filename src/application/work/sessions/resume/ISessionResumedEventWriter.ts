import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { AppendResult } from "../../../shared/persistence/IEventStore.js";

/**
 * Port interface for writing SessionResumed event to the event store.
 * Used by ResumeSessionCommandHandler to persist domain events.
 */
export interface ISessionResumedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
