import { ResumeWorkCommand } from "./ResumeWorkCommand.js";
import { IWorkerIdentityReader } from "../../host/workers/IWorkerIdentityReader.js";
import { IGoalStatusReader } from "../goals/IGoalStatusReader.js";
import { IGoalResumedEventWriter } from "../goals/resume/IGoalResumedEventWriter.js";
import { IGoalResumedEventReader } from "../goals/resume/IGoalResumedEventReader.js";
import { IGoalReader } from "../goals/resume/IGoalReader.js";
import { IEventBus } from "../../shared/messaging/IEventBus.js";
import { ResumeGoalCommandHandler } from "../goals/resume/ResumeGoalCommandHandler.js";
import { ResumeGoalCommand } from "../goals/resume/ResumeGoalCommand.js";
import { GoalClaimPolicy } from "../goals/claims/GoalClaimPolicy.js";
import { ISettingsReader } from "../../shared/settings/ISettingsReader.js";
import { GoalStatus } from "../../../domain/work/goals/Constants.js";
import { GoalView } from "../goals/GoalView.js";

/**
 * Result of resuming work.
 */
export interface ResumeWorkResult {
  readonly goalId: string;
  readonly objective: string;
}

/**
 * Handles resuming the current worker's paused goal.
 * Queries for the goal in PAUSED status claimed by the current worker,
 * then delegates to ResumeGoalCommandHandler.
 */
export class ResumeWorkCommandHandler {
  constructor(
    private readonly workerIdentityReader: IWorkerIdentityReader,
    private readonly goalStatusReader: IGoalStatusReader,
    private readonly goalResumedEventWriter: IGoalResumedEventWriter,
    private readonly goalResumedEventReader: IGoalResumedEventReader,
    private readonly goalReader: IGoalReader,
    private readonly eventBus: IEventBus,
    private readonly claimPolicy: GoalClaimPolicy,
    private readonly settingsReader: ISettingsReader
  ) {}

  async execute(_command: ResumeWorkCommand): Promise<ResumeWorkResult> {
    // 1. Get current worker's identity
    const workerId = this.workerIdentityReader.workerId;

    // 2. Query for goals in 'paused' status
    const pausedGoals = await this.goalStatusReader.findByStatus(GoalStatus.PAUSED);

    // 3. Find the goal claimed by this worker
    const pausedGoal = pausedGoals.find(
      (goal: GoalView) => goal.claimedBy === workerId
    );

    if (!pausedGoal) {
      throw new Error("No paused goal found for current worker");
    }

    // 4. Create ResumeGoalCommandHandler with atomic dependencies
    const resumeGoalCommandHandler = new ResumeGoalCommandHandler(
      this.goalResumedEventWriter,
      this.goalResumedEventReader,
      this.goalReader,
      this.eventBus,
      this.claimPolicy,
      this.workerIdentityReader,
      this.settingsReader
    );

    // 5. Create and execute ResumeGoalCommand
    const resumeCommand: ResumeGoalCommand = {
      goalId: pausedGoal.goalId
    };

    await resumeGoalCommandHandler.execute(resumeCommand);

    return {
      goalId: pausedGoal.goalId,
      objective: pausedGoal.objective
    };
  }
}
