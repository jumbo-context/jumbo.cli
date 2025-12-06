export * from "./add/GoalAddedEvent.js";
export * from "./block/GoalBlockedEvent.js";
export * from "./complete/GoalCompletedEvent.js";
export * from "./remove/GoalRemovedEvent.js";
export * from "./reset/GoalResetEvent.js";
export * from "./start/GoalStartedEvent.js";
export * from "./unblock/GoalUnblockedEvent.js";
export * from "./update/GoalUpdatedEvent.js";

import { GoalAddedEvent} from "./add/GoalAddedEvent.js";
import { GoalBlockedEvent} from "./block/GoalBlockedEvent.js";
import { GoalCompletedEvent} from "./complete/GoalCompletedEvent.js";
import { GoalRemovedEvent} from "./remove/GoalRemovedEvent.js";
import { GoalResetEvent} from "./reset/GoalResetEvent.js";
import { GoalStartedEvent} from "./start/GoalStartedEvent.js";
import { GoalUnblockedEvent} from "./unblock/GoalUnblockedEvent.js";
import { GoalUpdatedEvent} from "./update/GoalUpdatedEvent.js";

// Union type will expand as we add more events
export type GoalEvent = 
    GoalAddedEvent | 
    GoalBlockedEvent | 
    GoalCompletedEvent | 
    GoalRemovedEvent | 
    GoalResetEvent | 
    GoalStartedEvent | 
    GoalUnblockedEvent | 
    GoalUpdatedEvent;