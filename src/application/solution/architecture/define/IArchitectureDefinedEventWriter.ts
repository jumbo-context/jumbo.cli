import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { AppendResult } from "../../../shared/persistence/IEventStore.js";

/**
 * Port interface for writing ArchitectureDefinedEvent to the event store.
 * Used by DefineArchitectureCommandHandler to persist domain events.
 */
export interface IArchitectureDefinedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
