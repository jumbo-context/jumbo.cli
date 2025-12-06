import { RelationAdded } from "../../../domain/relations/add/RelationAddedEvent.js";

/**
 * Port interface for projecting RelationAdded event to the read model.
 * Used by RelationAddedEventHandler to update the projection store.
 */
export interface IRelationAddedProjector {
  applyRelationAdded(event: RelationAdded): Promise<void>;
}
