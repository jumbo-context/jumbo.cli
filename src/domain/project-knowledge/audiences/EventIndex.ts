export * from "./add/AudienceAddedEvent.js";
export * from "./update/AudienceUpdatedEvent.js";
export * from "./remove/AudienceRemovedEvent.js";

import { AudienceAdded } from "./add/AudienceAddedEvent.js";
import { AudienceUpdated } from "./update/AudienceUpdatedEvent.js";
import { AudienceRemoved } from "./remove/AudienceRemovedEvent.js";

// Union type of all audience events
export type AudienceEvent = AudienceAdded | AudienceUpdated | AudienceRemoved;
