export * from "./add/DependencyAddedEvent.js";
export * from "./update/DependencyUpdatedEvent.js";
export * from "./remove/DependencyRemovedEvent.js";

import { DependencyAdded } from "./add/DependencyAddedEvent.js";
import { DependencyUpdated } from "./update/DependencyUpdatedEvent.js";
import { DependencyRemoved } from "./remove/DependencyRemovedEvent.js";

// Union type of all dependency events
export type DependencyEvent =
  | DependencyAdded
  | DependencyUpdated
  | DependencyRemoved;
