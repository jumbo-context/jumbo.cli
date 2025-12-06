import { IEventHandler } from "../../../shared/messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { GoalCompletedEvent } from "../../../../domain/work/goals/complete/GoalCompletedEvent.js";
import { IGoalCompletedProjector } from "./IGoalCompletedProjector.js";

/**
 * Event handler for GoalCompletedEvent.
 *
 * Application layer handler that orchestrates projection updates
 * when a goal is completed. Subscribes to GoalCompletedEvent via event bus.
 */
export class GoalCompletedEventHandler implements IEventHandler {
  constructor(private readonly projector: IGoalCompletedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const goalCompletedEvent = event as GoalCompletedEvent;
    await this.projector.applyGoalCompleted(goalCompletedEvent);
  }
}
