import { SessionStarted } from "../../../../domain/work/sessions/start/SessionStartedEvent.js";

/**
 * Port interface for projecting SessionStarted event to the read model.
 * Used by SessionStartedEventHandler to update the projection store.
 */
export interface ISessionStartedProjector {
  applySessionStarted(event: SessionStarted): Promise<void>;
}
