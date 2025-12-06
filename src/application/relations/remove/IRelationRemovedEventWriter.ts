import { RelationRemoved } from "../../../domain/relations/remove/RelationRemovedEvent.js";
import { AppendResult } from "../../shared/persistence/IEventStore.js";

/**
 * Port interface for writing RelationRemoved event to the event store.
 * Used by RemoveRelationCommandHandler to persist domain events.
 */
export interface IRelationRemovedEventWriter {
  append(event: RelationRemoved): Promise<AppendResult>;
}
