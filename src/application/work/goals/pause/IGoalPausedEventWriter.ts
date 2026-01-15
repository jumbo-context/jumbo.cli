import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { AppendResult } from "../../../shared/persistence/IEventStore.js";

/**
 * Port interface for writing GoalPausedEvent to the event store.
 * Used by PauseGoalCommandHandler to persist domain events.
 */
export interface IGoalPausedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
