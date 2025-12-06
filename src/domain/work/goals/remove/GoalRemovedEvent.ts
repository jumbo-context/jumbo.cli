import { BaseEvent, ISO8601 } from "../../../shared/BaseEvent.js";

/**
 * Emitted when a goal is removed from the system.
 * This event marks the goal as no longer tracked.
 * The goal's history remains in the event store but it will not appear in active queries.
 */
export interface GoalRemovedEvent extends BaseEvent {
  readonly type: "GoalRemovedEvent";
  readonly payload: {
    readonly removedAt: ISO8601;
  };
}
