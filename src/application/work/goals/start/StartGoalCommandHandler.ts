import { StartGoalCommand } from "./StartGoalCommand.js";
import { IGoalStartedEventWriter } from "./IGoalStartedEventWriter.js";
import { IGoalStartedEventReader } from "./IGoalStartedEventReader.js";
import { IGoalReader } from "./IGoalReader.js";
import { IEventBus } from "../../../shared/messaging/IEventBus.js";
import { Goal } from "../../../../domain/work/goals/Goal.js";
import { GoalErrorMessages, formatErrorMessage } from "../../../../domain/work/goals/Constants.js";

/**
 * Handles starting of a defined goal.
 * Loads aggregate from event history, calls domain logic, persists event.
 */
export class StartGoalCommandHandler {
  constructor(
    private readonly eventWriter: IGoalStartedEventWriter,
    private readonly eventReader: IGoalStartedEventReader,
    private readonly goalReader: IGoalReader,
    private readonly eventBus: IEventBus
  ) {}

  async execute(command: StartGoalCommand): Promise<{ goalId: string }> {
    // 1. Check goal exists (query projection for fast check)
    const view = await this.goalReader.findById(command.goalId);
    if (!view) {
      throw new Error(
        formatErrorMessage(GoalErrorMessages.GOAL_NOT_FOUND, { id: command.goalId })
      );
    }

    // 2. Rehydrate aggregate from event history (event sourcing)
    const history = await this.eventReader.readStream(command.goalId);
    const goal = Goal.rehydrate(command.goalId, history as any);

    // 3. Domain logic produces event (validates state)
    const event = goal.start();

    // 4. Persist event to file store
    await this.eventWriter.append(event);

    // 5. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    return { goalId: command.goalId };
  }
}
