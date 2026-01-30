import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { AppendResult } from "../../../shared/persistence/IEventStore.js";

/**
 * Port interface for writing GoalProgressUpdatedEvent to the event store.
 * Used by UpdateGoalProgressCommandHandler to persist domain events.
 */
export interface IGoalProgressUpdatedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
