import { RelationAdded } from "../../../domain/relations/add/RelationAddedEvent.js";
import { AppendResult } from "../../shared/persistence/IEventStore.js";

/**
 * Port interface for writing RelationAdded event to the event store.
 * Used by AddRelationCommandHandler to persist domain events.
 */
export interface IRelationAddedEventWriter {
  append(event: RelationAdded): Promise<AppendResult>;
}
