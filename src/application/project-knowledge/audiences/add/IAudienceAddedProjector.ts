import { AudienceAdded } from "../../../../domain/project-knowledge/audiences/add/AudienceAddedEvent.js";

/**
 * Port interface for projecting AudienceAdded events to the read model.
 * Used by AudienceAddedEventHandler to update the projection store.
 */
export interface IAudienceAddedProjector {
  applyAudienceAdded(event: AudienceAdded): Promise<void>;
}
