import { IEventHandler } from "../../../shared/messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { GoalRemovedEvent } from "../../../../domain/work/goals/remove/GoalRemovedEvent.js";
import { IGoalRemovedProjector } from "./IGoalRemovedProjector.js";

/**
 * Event handler for GoalRemovedEvent.
 *
 * Application layer handler that orchestrates projection updates
 * when a goal is removed. Subscribes to GoalRemovedEvent via event bus.
 */
export class GoalRemovedEventHandler implements IEventHandler {
  constructor(private readonly projector: IGoalRemovedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const goalRemovedEvent = event as GoalRemovedEvent;
    await this.projector.applyGoalRemoved(goalRemovedEvent);
  }
}
