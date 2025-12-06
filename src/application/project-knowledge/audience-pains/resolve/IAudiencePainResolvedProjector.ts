import { AudiencePainResolved } from "../../../../domain/project-knowledge/audience-pains/resolve/AudiencePainResolvedEvent.js";

/**
 * Port interface for projecting AudiencePainResolved events to the read model.
 * Used by AudiencePainResolvedEventHandler to update the projection store.
 */
export interface IAudiencePainResolvedProjector {
  applyAudiencePainResolved(event: AudiencePainResolved): Promise<void>;
}
