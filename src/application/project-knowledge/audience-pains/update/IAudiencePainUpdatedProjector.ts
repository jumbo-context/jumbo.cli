import { AudiencePainUpdated } from "../../../../domain/project-knowledge/audience-pains/update/AudiencePainUpdatedEvent.js";

/**
 * Port interface for projecting AudiencePainUpdated events to the read model.
 * Used by AudiencePainUpdatedEventHandler to update the projection store.
 */
export interface IAudiencePainUpdatedProjector {
  applyAudiencePainUpdated(event: AudiencePainUpdated): Promise<void>;
}
