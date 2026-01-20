import { IGoalReviewedEventReader } from "./IGoalReviewedEventReader.js";
import { ISettingsReader } from "../../../shared/settings/ISettingsReader.js";
import { GoalEventType } from "../../../../domain/work/goals/Constants.js";

/**
 * ReviewTurnTracker - Service for tracking review turn count and enforcing turn limits.
 *
 * Responsibilities:
 * - Count reviews from event history
 * - Read turn limit from settings
 * - Determine when to auto-commit based on turn limit
 * - Calculate remaining turns for user feedback
 */
export class ReviewTurnTracker {
  constructor(
    private readonly reviewEventReader: IGoalReviewedEventReader,
    private readonly settingsReader: ISettingsReader
  ) {}

  /**
   * Get the current turn count for a goal.
   * Counts GoalReviewedEvent occurrences in the event stream.
   *
   * @param goalId - The goal ID to check
   * @returns Promise<number> - Number of reviews so far
   */
  async getCurrentTurnCount(goalId: string): Promise<number> {
    const events = await this.reviewEventReader.readStream(goalId);
    return events.filter((e) => e.type === GoalEventType.REVIEWED).length;
  }

  /**
   * Get the configured turn limit from settings.
   *
   * @returns Promise<number> - The turn limit from settings
   */
  async getTurnLimit(): Promise<number> {
    const settings = await this.settingsReader.read();
    return settings.qa.defaultTurnLimit;
  }

  /**
   * Determine if the goal should be auto-committed based on turn count.
   * Returns true if current turn count has reached or exceeded the limit.
   *
   * @param goalId - The goal ID to check
   * @returns Promise<boolean> - True if should auto-commit
   */
  async shouldAutoCommit(goalId: string): Promise<boolean> {
    const currentTurn = await this.getCurrentTurnCount(goalId);
    const turnLimit = await this.getTurnLimit();
    return currentTurn >= turnLimit;
  }

  /**
   * Get the number of remaining review turns before auto-commit.
   * Returns 0 if limit has been reached or exceeded.
   *
   * @param goalId - The goal ID to check
   * @returns Promise<number> - Number of remaining turns
   */
  async getRemainingTurns(goalId: string): Promise<number> {
    const currentTurn = await this.getCurrentTurnCount(goalId);
    const turnLimit = await this.getTurnLimit();
    const remaining = turnLimit - currentTurn;
    return Math.max(0, remaining);
  }
}
