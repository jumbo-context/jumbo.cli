import { SessionSummaryProjection } from "../SessionSummaryView.js";
import { GoalView } from "../../goals/GoalView.js";
import { ProjectView } from "../../../project-knowledge/project/ProjectView.js";
import { AudienceView } from "../../../project-knowledge/audiences/AudienceView.js";
import { AudiencePainView } from "../../../project-knowledge/audience-pains/AudiencePainView.js";

/**
 * SessionStartContextView - Complete data model for session start orientation
 *
 * This view encapsulates all the data needed to render the session start
 * context packet. It follows CQRS principles by providing a single cohesive
 * read model that the presentation layer can render.
 *
 * The application layer assembles this view from multiple projection stores,
 * keeping the presentation layer free from repository orchestration concerns.
 *
 * Contents:
 * - project: Project context (name, purpose)
 * - audiences: Target audiences for the project
 * - audiencePains: Active pain points being addressed
 * - latestSessionSummary: Historical context (what was worked on previously)
 * - inProgressGoals: Current active work (goals with status='doing')
 * - plannedGoals: Available work (goals with status='to-do')
 */
export interface SessionStartContextView {
  /**
   * Project context (name, purpose, boundaries)
   * Null if project hasn't been initialized
   */
  readonly project: ProjectView | null;

  /**
   * Target audiences for the project (active only)
   */
  readonly audiences: AudienceView[];

  /**
   * Active pain points being addressed by the project
   */
  readonly audiencePains: AudiencePainView[];

  /**
   * Summary of the most recent session (historical context)
   * Null if this is the first-ever session (brownfield project scenario)
   */
  readonly latestSessionSummary: SessionSummaryProjection | null;

  /**
   * Goals currently being worked on (status='doing')
   * Typically should be 0-1 goals in progress
   */
  readonly inProgressGoals: GoalView[];

  /**
   * Goals available to work on next (status='to-do')
   * These are planned but not yet started
   */
  readonly plannedGoals: GoalView[];

  /**
   * Indicates whether the project has any solution context recorded in Jumbo.
   *
   * Solution context includes:
   * - Architecture (patterns, principles, tech stack, data flow)
   * - Components (system parts and their responsibilities)
   * - Decisions (architectural and design choices with rationale)
   * - Invariants (non-negotiable constraints)
   * - Guidelines (coding standards and practices)
   *
   * When false, this is a brownfield project that needs priming - the LLM should
   * proactively offer to help transfer existing project knowledge into Jumbo.
   */
  readonly hasSolutionContext: boolean;
}
