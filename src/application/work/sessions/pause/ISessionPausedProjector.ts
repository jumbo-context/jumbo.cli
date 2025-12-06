import { SessionPaused } from "../../../../domain/work/sessions/pause/SessionPausedEvent.js";

/**
 * Port interface for projecting SessionPaused event to the read model.
 * Used by SessionPausedEventHandler to update the projection store.
 */
export interface ISessionPausedProjector {
  applySessionPaused(event: SessionPaused): Promise<void>;
}
