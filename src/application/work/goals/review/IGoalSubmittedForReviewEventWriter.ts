import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { AppendResult } from "../../../shared/persistence/IEventStore.js";

/**
 * Port interface for writing GoalSubmittedForReviewEvent to the event store.
 * Used by SubmitGoalForReviewCommandHandler to persist domain events.
 */
export interface IGoalSubmittedForReviewEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
