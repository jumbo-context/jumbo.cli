import { IEventHandler } from "../../../shared/messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { GoalStartedEvent } from "../../../../domain/work/goals/start/GoalStartedEvent.js";
import { IGoalStartedProjector } from "./IGoalStartedProjector.js";

/**
 * Event handler for GoalStartedEvent.
 *
 * Application layer handler that orchestrates projection updates
 * when a goal is started. Subscribes to GoalStartedEvent via event bus.
 */
export class GoalStartedEventHandler implements IEventHandler {
  constructor(private readonly projector: IGoalStartedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const goalStartedEvent = event as GoalStartedEvent;
    await this.projector.applyGoalStarted(goalStartedEvent);
  }
}
