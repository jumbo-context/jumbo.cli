import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { AppendResult } from "../../../shared/persistence/IEventStore.js";

/**
 * Port interface for writing DependencyAddedEvent to the event store.
 * Used by AddDependencyCommandHandler to persist domain events.
 */
export interface IDependencyAddedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
