import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { AppendResult } from "../../../shared/persistence/IEventStore.js";

/**
 * Port interface for writing DependencyRemovedEvent to the event store.
 * Used by RemoveDependencyCommandHandler to persist domain events.
 */
export interface IDependencyRemovedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
