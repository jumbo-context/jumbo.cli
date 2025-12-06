export * from "./add/AudiencePainAddedEvent.js";
export * from "./update/AudiencePainUpdatedEvent.js";
export * from "./resolve/AudiencePainResolvedEvent.js";

import { AudiencePainAdded } from "./add/AudiencePainAddedEvent.js";
import { AudiencePainUpdated } from "./update/AudiencePainUpdatedEvent.js";
import { AudiencePainResolved } from "./resolve/AudiencePainResolvedEvent.js";

// Union type of all audience pain events
export type AudiencePainEvent = AudiencePainAdded | AudiencePainUpdated | AudiencePainResolved;
