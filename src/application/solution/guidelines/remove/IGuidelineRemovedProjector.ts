import { GuidelineRemoved } from "../../../../domain/solution/guidelines/remove/GuidelineRemovedEvent.js";

/**
 * Port interface for projecting GuidelineRemovedEvent to the read model.
 * Used by GuidelineRemovedEventHandler to update the projection store.
 */
export interface IGuidelineRemovedProjector {
  applyGuidelineRemoved(event: GuidelineRemoved): Promise<void>;
}
