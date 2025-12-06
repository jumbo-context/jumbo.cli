import { AudienceRemoved } from "../../../../domain/project-knowledge/audiences/remove/AudienceRemovedEvent.js";

/**
 * Port interface for projecting AudienceRemoved events to the read model.
 * Used by AudienceRemovedEventHandler to update the projection store.
 */
export interface IAudienceRemovedProjector {
  applyAudienceRemoved(event: AudienceRemoved): Promise<void>;
}
