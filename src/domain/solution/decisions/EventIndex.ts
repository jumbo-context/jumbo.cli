export * from "./add/DecisionAddedEvent.js";
export * from "./update/DecisionUpdatedEvent.js";
export * from "./reverse/DecisionReversedEvent.js";
export * from "./supersede/DecisionSupersededEvent.js";

import { DecisionAdded } from "./add/DecisionAddedEvent.js";
import { DecisionUpdated } from "./update/DecisionUpdatedEvent.js";
import { DecisionReversed } from "./reverse/DecisionReversedEvent.js";
import { DecisionSuperseded } from "./supersede/DecisionSupersededEvent.js";

// Union type of all decision events
export type DecisionEvent =
  | DecisionAdded
  | DecisionUpdated
  | DecisionReversed
  | DecisionSuperseded;
