import { ISessionSummaryReader } from "./ISessionSummaryReader.js";
import { IGoalStatusReader } from "../../goals/IGoalStatusReader.js";
import { SessionStartContextView } from "./SessionStartContextView.js";
import { GoalStatus } from "../../../../domain/work/goals/Constants.js";
import { IProjectContextReader } from "../../../project-knowledge/project/query/IProjectContextReader.js";
import { IAudienceContextReader } from "../../../project-knowledge/audiences/query/IAudienceContextReader.js";
import { IAudiencePainContextReader } from "../../../project-knowledge/audience-pains/query/IAudiencePainContextReader.js";
import { UnprimedBrownfieldQualifier } from "../../../solution/UnprimedBrownfieldQualifier.js";

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
 *   const query = new GetSessionStartContextQueryHandler(sessionSummaryStore, goalStatusReader, ...);
 *   const context = await query.execute();
 *   // Render context in presentation layer
 */
export class GetSessionStartContextQueryHandler {
  constructor(
    private readonly sessionSummaryReader: ISessionSummaryReader,
    private readonly goalStatusReader: IGoalStatusReader,
    private readonly projectContextReader?: IProjectContextReader,
    private readonly audienceContextReader?: IAudienceContextReader,
    private readonly audiencePainContextReader?: IAudiencePainContextReader,
    private readonly unprimedBrownfieldQualifier?: UnprimedBrownfieldQualifier
  ) {}

  /**
   * Execute query to assemble complete session start context
   *
   * Assembles:
   * 1. Project context (name, purpose, tagline)
   * 2. Target audiences
   * 3. Active audience pains
   * 4. Latest session summary (historical context)
   * 5. In-progress goals (current active work)
   * 6. Planned goals (available work)
   *
   * @returns SessionStartContextView with all assembled data
   */
  async execute(): Promise<SessionStartContextView> {
    // Query all projection stores in parallel for efficiency
    const [
      project,
      audiences,
      audiencePains,
      latestSessionSummary,
      inProgressGoals,
      plannedGoals,
      isUnprimed,
    ] = await Promise.all([
      this.projectContextReader?.getProject() ?? Promise.resolve(null),
      this.audienceContextReader?.findAllActive() ?? Promise.resolve([]),
      this.audiencePainContextReader?.findAllActive() ?? Promise.resolve([]),
      this.sessionSummaryReader.findLatest(),
      this.goalStatusReader.findByStatus(GoalStatus.DOING),
      this.goalStatusReader.findByStatus(GoalStatus.TODO),
      this.unprimedBrownfieldQualifier?.isUnprimed() ?? Promise.resolve(false),
    ]);

    return {
      project,
      audiences,
      audiencePains,
      latestSessionSummary,
      inProgressGoals,
      plannedGoals,
      hasSolutionContext: !isUnprimed,
    };
  }
}
