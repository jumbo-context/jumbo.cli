import { SessionEnded } from "../../../../domain/work/sessions/end/SessionEndedEvent.js";

/**
 * Port interface for projecting SessionEnded event to the read model.
 * Used by SessionEndedEventHandler to update the projection store.
 */
export interface ISessionEndedProjector {
  applySessionEnded(event: SessionEnded): Promise<void>;
}
