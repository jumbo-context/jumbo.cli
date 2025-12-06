export * from "./add/ComponentAddedEvent.js";
export * from "./update/ComponentUpdatedEvent.js";
export * from "./deprecate/ComponentDeprecatedEvent.js";
export * from "./remove/ComponentRemovedEvent.js";

import { ComponentAdded } from "./add/ComponentAddedEvent.js";
import { ComponentUpdated } from "./update/ComponentUpdatedEvent.js";
import { ComponentDeprecated } from "./deprecate/ComponentDeprecatedEvent.js";
import { ComponentRemoved } from "./remove/ComponentRemovedEvent.js";

// Union type of all component events
export type ComponentEvent =
  | ComponentAdded
  | ComponentUpdated
  | ComponentDeprecated
  | ComponentRemoved;
