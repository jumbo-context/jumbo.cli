import { ResetGoalCommand } from "./ResetGoalCommand.js";
import { IGoalResetEventWriter } from "./IGoalResetEventWriter.js";
import { IGoalResetEventReader } from "./IGoalResetEventReader.js";
import { IGoalResetReader } from "./IGoalResetReader.js";
import { IEventBus } from "../../../shared/messaging/IEventBus.js";
import { Goal } from "../../../../domain/work/goals/Goal.js";
import { GoalErrorMessages, formatErrorMessage } from "../../../../domain/work/goals/Constants.js";

/**
 * Handles resetting a goal back to 'to-do' status.
 * Loads aggregate from event history, calls domain logic, persists event.
 */
export class ResetGoalCommandHandler {
  constructor(
    private readonly eventWriter: IGoalResetEventWriter,
    private readonly eventReader: IGoalResetEventReader,
    private readonly goalReader: IGoalResetReader,
    private readonly eventBus: IEventBus
  ) {}

  async execute(command: ResetGoalCommand): Promise<{ goalId: string }> {
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
    const event = goal.reset();

    // 4. Persist event to file store
    await this.eventWriter.append(event);

    // 5. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    return { goalId: command.goalId };
  }
}
