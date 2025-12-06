import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { AppendResult } from "../../../shared/persistence/IEventStore.js";

/**
 * Port interface for writing GoalStartedEvent to the event store.
 * Used by StartGoalCommandHandler to persist domain events.
 */
export interface IGoalStartedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
