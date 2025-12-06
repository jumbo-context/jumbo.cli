import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { AppendResult } from "../../../shared/persistence/IEventStore.js";

/**
 * Port interface for writing ArchitectureUpdatedEvent to the event store.
 * Used by UpdateArchitectureCommandHandler to persist domain events.
 */
export interface IArchitectureUpdatedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
