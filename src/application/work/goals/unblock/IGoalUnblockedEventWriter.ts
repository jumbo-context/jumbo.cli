import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { AppendResult } from "../../../shared/persistence/IEventStore.js";

/**
 * Port interface for writing GoalUnblockedEvent to the event store.
 * Used by UnblockGoalCommandHandler to persist domain events.
 */
export interface IGoalUnblockedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
