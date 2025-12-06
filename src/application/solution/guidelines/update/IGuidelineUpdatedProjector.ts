import { GuidelineUpdated } from "../../../../domain/solution/guidelines/update/GuidelineUpdatedEvent.js";

/**
 * Port interface for projecting GuidelineUpdatedEvent to the read model.
 * Used by GuidelineUpdatedEventHandler to update the projection store.
 */
export interface IGuidelineUpdatedProjector {
  applyGuidelineUpdated(event: GuidelineUpdated): Promise<void>;
}
