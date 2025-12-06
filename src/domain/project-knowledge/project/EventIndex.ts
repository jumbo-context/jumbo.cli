export * from "./init/ProjectInitializedEvent.js";
export * from "./update/ProjectUpdatedEvent.js";

import { ProjectInitialized } from "./init/ProjectInitializedEvent.js";
import { ProjectUpdated } from "./update/ProjectUpdatedEvent.js";

// Union type will expand as we add more events
export type ProjectEvent = ProjectInitialized | ProjectUpdated;
