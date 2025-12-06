import { SessionSummaryProjection } from "../SessionSummaryView.js";
import { GoalView } from "../../goals/GoalView.js";

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
 * - latestSessionSummary: Historical context (what was worked on previously)
 * - inProgressGoals: Current active work (goals with status='doing')
 * - plannedGoals: Available work (goals with status='to-do')
 */
export interface SessionStartContextView {
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
}
