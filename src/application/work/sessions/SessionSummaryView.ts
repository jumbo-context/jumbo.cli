import { UUID, ISO8601 } from "../../../domain/shared/BaseEvent.js";

/**
 * SessionSummaryProjection - Read model for session orientation
 *
 * This is a CQRS projection that maintains a running summary of what
 * transpires during a session. It subscribes to events from multiple
 * aggregates (Session, Goal, Decision) to build a comprehensive view.
 *
 * Lifecycle:
 * - Created (seed) when SessionStarted fires
 * - Updated as events occur during the session
 * - Finalized when SessionEnded fires
 * - Queried at next session start for orientation
 *
 * The "LATEST" Pattern:
 * - Most recent session always stored with sessionId='LATEST'
 * - Historical sessions stored with original UUID
 * - Enables O(1) context retrieval via primary key lookup
 */

/**
 * Reference to a completed goal
 */
export interface GoalReference {
  readonly goalId: UUID;
  readonly objective: string;
  readonly status: string;
  readonly createdAt: ISO8601;
}

/**
 * Reference to a blocker encountered during the session
 */
export interface BlockerReference {
  readonly goalId: UUID;
  readonly reason: string;
}

/**
 * Reference to a decision made during the session
 */
export interface DecisionReference {
  readonly decisionId: UUID;
  readonly title: string;
  readonly rationale: string;
}

/**
 * SessionSummaryProjection - Materialized view of session activity
 *
 * This projection answers three key questions at session start:
 * 1. What was recently worked on? (completedGoals)
 * 2. What was the state of recent work? (blockersEncountered)
 * 3. What decisions were made? (decisions)
 *
 * Note: "What can we work on next?" is answered by querying current
 * goal_views with status='to-do' (not stored here - that's current state)
 */
export interface SessionSummaryProjection {
  /**
   * Session ID - 'LATEST' for current/most recent, or permanent UUID for historical
   */
  readonly sessionId: string;

  /**
   * The actual session UUID (preserved when using 'LATEST')
   */
  readonly originalSessionId: UUID;

  /**
   * Main focus/theme of the session
   */
  readonly focus: string;

  /**
   * Session status
   */
  readonly status: "active" | "paused" | "ended";

  /**
   * Reference to context snapshot (optional)
   */
  readonly contextSnapshot: UUID | null;

  /**
   * Goals completed during this session
   * Historical data - what was accomplished
   */
  readonly completedGoals: GoalReference[];

  /**
   * Blockers encountered during this session
   * Historical data - what was stuck
   */
  readonly blockersEncountered: BlockerReference[];

  /**
   * Decisions made during this session
   * Historical data - what was decided
   */
  readonly decisions: DecisionReference[];

  /**
   * Timestamp when session was created
   */
  readonly createdAt: ISO8601;

  /**
   * Timestamp when session was last updated
   */
  readonly updatedAt: ISO8601;
}
