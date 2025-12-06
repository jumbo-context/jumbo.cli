import { AudiencePainAdded } from "../../../../domain/project-knowledge/audience-pains/add/AudiencePainAddedEvent.js";

/**
 * Port interface for projecting AudiencePainAdded events to the read model.
 * Used by AudiencePainAddedEventHandler to update the projection store.
 */
export interface IAudiencePainAddedProjector {
  applyAudiencePainAdded(event: AudiencePainAdded): Promise<void>;
}
