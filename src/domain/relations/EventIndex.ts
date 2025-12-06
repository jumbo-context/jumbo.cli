export * from "./add/RelationAddedEvent.js";
export * from "./remove/RelationRemovedEvent.js";

import { RelationAdded } from "./add/RelationAddedEvent.js";
import { RelationRemoved } from "./remove/RelationRemovedEvent.js";

// Union type will expand as we add more events
export type RelationEvent = RelationAdded | RelationRemoved;
