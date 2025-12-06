export * from "./start/SessionStartedEvent.js";
export * from "./pause/SessionPausedEvent.js";
export * from "./resume/SessionResumedEvent.js";
export * from "./end/SessionEndedEvent.js";

import { SessionStarted } from "./start/SessionStartedEvent.js";
import { SessionPaused } from "./pause/SessionPausedEvent.js";
import { SessionResumed } from "./resume/SessionResumedEvent.js";
import { SessionEnded } from "./end/SessionEndedEvent.js";

// Union type will expand as we add more events
export type SessionEvent = SessionStarted | SessionPaused | SessionResumed | SessionEnded;
