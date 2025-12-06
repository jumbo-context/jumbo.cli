import { RelationRemoved } from "../../../domain/relations/remove/RelationRemovedEvent.js";

/**
 * Port interface for projecting RelationRemoved event to the read model.
 * Used by RelationRemovedEventHandler to update the projection store.
 */
export interface IRelationRemovedProjector {
  applyRelationRemoved(event: RelationRemoved): Promise<void>;
}
