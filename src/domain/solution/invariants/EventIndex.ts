export * from "./add/InvariantAddedEvent.js";
export * from "./update/InvariantUpdatedEvent.js";
export * from "./remove/InvariantRemovedEvent.js";

import { InvariantAdded } from "./add/InvariantAddedEvent.js";
import { InvariantUpdated } from "./update/InvariantUpdatedEvent.js";
import { InvariantRemoved } from "./remove/InvariantRemovedEvent.js";

// Union type of all invariant events
export type InvariantEvent =
  | InvariantAdded
  | InvariantUpdated
  | InvariantRemoved;
