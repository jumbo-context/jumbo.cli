import { GuidelineAdded } from "../../../../domain/solution/guidelines/add/GuidelineAddedEvent.js";

/**
 * Port interface for projecting GuidelineAddedEvent to the read model.
 * Used by GuidelineAddedEventHandler to update the projection store.
 */
export interface IGuidelineAddedProjector {
  applyGuidelineAdded(event: GuidelineAdded): Promise<void>;
}
