export * from "./add/ValuePropositionAddedEvent.js";
export * from "./update/ValuePropositionUpdatedEvent.js";
export * from "./remove/ValuePropositionRemovedEvent.js";

import { ValuePropositionAdded } from "./add/ValuePropositionAddedEvent.js";
import { ValuePropositionUpdated } from "./update/ValuePropositionUpdatedEvent.js";
import { ValuePropositionRemoved } from "./remove/ValuePropositionRemovedEvent.js";

// Union type will expand as we add more events
export type ValuePropositionEvent =
  | ValuePropositionAdded
  | ValuePropositionUpdated
  | ValuePropositionRemoved;
