import { ResumeGoalCommand } from "./ResumeGoalCommand.js";
import { IGoalResumedEventWriter } from "./IGoalResumedEventWriter.js";
import { IGoalResumedEventReader } from "./IGoalResumedEventReader.js";
import { IGoalReader } from "./IGoalReader.js";
import { IEventBus } from "../../../shared/messaging/IEventBus.js";
import { Goal } from "../../../../domain/work/goals/Goal.js";
import { GoalErrorMessages, formatErrorMessage } from "../../../../domain/work/goals/Constants.js";

/**
 * Handles resuming of a paused goal.
 * Loads aggregate from event history, calls domain logic, persists event.
 */
export class ResumeGoalCommandHandler {
  constructor(
    private readonly eventWriter: IGoalResumedEventWriter,
    private readonly eventReader: IGoalResumedEventReader,
    private readonly goalReader: IGoalReader,
    private readonly eventBus: IEventBus
  ) {}

  async execute(command: ResumeGoalCommand): Promise<{ goalId: string }> {
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
    const event = goal.resume(command.note);

    // 4. Persist event to file store
    await this.eventWriter.append(event);

    // 5. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    return { goalId: command.goalId };
  }
}
