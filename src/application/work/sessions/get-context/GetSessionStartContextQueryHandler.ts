import { ISessionSummaryReader } from "./ISessionSummaryReader.js";
import { IGoalStatusReader } from "../../goals/IGoalStatusReader.js";
import { SessionStartContextView } from "./SessionStartContextView.js";
import { GoalStatus } from "../../../../domain/work/goals/Constants.js";

/**
 * GetSessionStartContextQueryHandler - Query handler for session start orientation context
 *
 * This query assembles all the data needed for session start context delivery.
 * It follows CQRS principles by:
 * - Living in the application layer (not presentation)
 * - Orchestrating multiple projection stores to build a cohesive view
 * - Returning a complete data model that the presentation layer can render
 *
 * This separates concerns properly:
 * - Application layer: data assembly and business logic
 * - Presentation layer: rendering and user interaction
 *
 * Usage:
 *   const query = new GetSessionStartContextQueryHandler(sessionSummaryStore, goalStatusReader);
 *   const context = await query.execute();
 *   // Render context in presentation layer
 */
export class GetSessionStartContextQueryHandler {
  constructor(
    private readonly sessionSummaryReader: ISessionSummaryReader,
    private readonly goalStatusReader: IGoalStatusReader
  ) {}

  /**
   * Execute query to assemble complete session start context
   *
   * Assembles:
   * 1. Latest session summary (historical context)
   * 2. In-progress goals (current active work)
   * 3. Planned goals (available work)
   *
   * @returns SessionStartContextView with all assembled data
   */
  async execute(): Promise<SessionStartContextView> {
    // Query all projection stores in parallel for efficiency
    const [latestSessionSummary, inProgressGoals, plannedGoals] = await Promise.all([
      this.sessionSummaryReader.findLatest(),
      this.goalStatusReader.findByStatus(GoalStatus.DOING),
      this.goalStatusReader.findByStatus(GoalStatus.TODO),
    ]);

    return {
      latestSessionSummary,
      inProgressGoals,
      plannedGoals,
    };
  }
}
