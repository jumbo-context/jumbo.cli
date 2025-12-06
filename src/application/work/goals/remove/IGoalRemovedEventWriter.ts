import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { AppendResult } from "../../../shared/persistence/IEventStore.js";

/**
 * Port interface for writing GoalRemovedEvent to the event store.
 * Used by RemoveGoalCommandHandler to persist domain events.
 */
export interface IGoalRemovedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
