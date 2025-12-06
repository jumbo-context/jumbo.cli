import { AudienceUpdated } from "../../../../domain/project-knowledge/audiences/update/AudienceUpdatedEvent.js";

/**
 * Port interface for projecting AudienceUpdated events to the read model.
 * Used by AudienceUpdatedEventHandler to update the projection store.
 */
export interface IAudienceUpdatedProjector {
  applyAudienceUpdated(event: AudienceUpdated): Promise<void>;
}
