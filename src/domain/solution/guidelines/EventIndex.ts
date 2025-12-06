export * from "./add/GuidelineAddedEvent.js";
export * from "./update/GuidelineUpdatedEvent.js";
export * from "./remove/GuidelineRemovedEvent.js";

import { GuidelineAdded } from "./add/GuidelineAddedEvent.js";
import { GuidelineUpdated } from "./update/GuidelineUpdatedEvent.js";
import { GuidelineRemoved } from "./remove/GuidelineRemovedEvent.js";

// Union type of all guideline events
export type GuidelineEvent =
  | GuidelineAdded
  | GuidelineUpdated
  | GuidelineRemoved;
