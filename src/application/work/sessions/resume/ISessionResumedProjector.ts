import { SessionResumed } from "../../../../domain/work/sessions/resume/SessionResumedEvent.js";

/**
 * Port interface for projecting SessionResumed event to the read model.
 * Used by SessionResumedEventHandler to update the projection store.
 */
export interface ISessionResumedProjector {
  applySessionResumed(event: SessionResumed): Promise<void>;
}
