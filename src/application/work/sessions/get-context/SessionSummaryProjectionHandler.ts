import { IEventBus } from "../../../shared/messaging/IEventBus.js";
import { ISessionSummaryProjectionStore } from "./ISessionSummaryProjectionStore.js";
import { IGoalReadForSessionSummary } from "./IGoalReadForSessionSummary.js";
import { IDecisionSessionReader } from "./IDecisionSessionReader.js";
import { SessionStarted } from "../../../../domain/work/sessions/start/SessionStartedEvent.js";
import { SessionEnded } from "../../../../domain/work/sessions/end/SessionEndedEvent.js";
import { SessionPaused } from "../../../../domain/work/sessions/pause/SessionPausedEvent.js";
import { SessionResumed } from "../../../../domain/work/sessions/resume/SessionResumedEvent.js";
import { GoalCompletedEvent } from "../../../../domain/work/goals/complete/GoalCompletedEvent.js";
import { GoalBlockedEvent } from "../../../../domain/work/goals/block/GoalBlockedEvent.js";
import { DecisionAdded } from "../../../../domain/solution/decisions/add/DecisionAddedEvent.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";

/**
 * SessionSummaryProjectionHandler - Updates SessionSummary projection
 *
 * This is a cross-aggregate projection handler (standard CQRS pattern).
 * It subscribes to events from multiple aggregates to build a comprehensive
 * session summary for orientation context.
 *
 * Subscriptions:
 * - Session events: SessionStarted, SessionEnded, SessionPaused, SessionResumed
 * - Goal events: GoalCompletedEvent, GoalBlockedEvent
 * - Decision events: DecisionAdded
 *
 * Event Data Enrichment Pattern:
 * Events remain lean (just IDs and state changes). This handler enriches
 * event data by querying source projection stores to get additional details
 * like objective, reason, title, etc.
 *
 * The "LATEST" Pattern:
 * - All updates target the 'LATEST' session summary
 * - SessionStarted archives old LATEST (if ended) before creating new one
 * - Only updates when LATEST status='active'
 */
export class SessionSummaryProjectionHandler {
  constructor(
    private readonly eventBus: IEventBus,
    private readonly store: ISessionSummaryProjectionStore,
    private readonly goalReader: IGoalReadForSessionSummary,
    private readonly decisionReader: IDecisionSessionReader
  ) {}

  /**
   * Subscribe to all relevant events from multiple aggregates
   */
  subscribe(): void {
    // Session events
    this.eventBus.subscribe(
      "SessionStarted",
      { handle: this.handleSessionStarted.bind(this) }
    );
    this.eventBus.subscribe(
      "SessionEnded",
      { handle: this.handleSessionEnded.bind(this) }
    );
    this.eventBus.subscribe(
      "SessionPaused",
      { handle: this.handleSessionPaused.bind(this) }
    );
    this.eventBus.subscribe(
      "SessionResumed",
      { handle: this.handleSessionResumed.bind(this) }
    );

    // Goal events (cross-aggregate)
    this.eventBus.subscribe(
      "GoalCompletedEvent",
      { handle: this.handleGoalCompleted.bind(this) }
    );
    this.eventBus.subscribe(
      "GoalBlockedEvent",
      { handle: this.handleGoalBlocked.bind(this) }
    );

    // Decision events (cross-aggregate)
    this.eventBus.subscribe(
      "DecisionAdded",
      { handle: this.handleDecisionAdded.bind(this) }
    );
  }

  /**
   * SessionStarted → Archive old LATEST and create new LATEST seed
   *
   * Archival Logic:
   * - If LATEST exists and status='ended', clone it to permanent ID
   * - Create/overwrite LATEST with new session seed (empty arrays)
   */
  private async handleSessionStarted(event: BaseEvent): Promise<void> {
    const sessionStartedEvent = event as SessionStarted;

    // Archive existing LATEST if it exists and is ended
    await this.store.archiveLatest();

    // Create/overwrite LATEST with new session seed
    await this.store.upsertLatest({
      sessionId: "LATEST",
      originalSessionId: sessionStartedEvent.aggregateId,
      focus: sessionStartedEvent.payload.focus,
      status: "active",
      contextSnapshot: sessionStartedEvent.payload.contextSnapshot,
      completedGoals: [],
      blockersEncountered: [],
      decisions: [],
      createdAt: sessionStartedEvent.timestamp,
      updatedAt: sessionStartedEvent.timestamp,
    });
  }

  /**
   * SessionEnded → Mark LATEST as ended
   *
   * Clone to permanent ID happens on next SessionStarted (lazy archival)
   */
  private async handleSessionEnded(event: BaseEvent): Promise<void> {
    const sessionEndedEvent = event as SessionEnded;

    await this.store.update("LATEST", {
      status: "ended",
      updatedAt: sessionEndedEvent.timestamp,
    });
  }

  /**
   * SessionPaused → Update LATEST status
   */
  private async handleSessionPaused(event: BaseEvent): Promise<void> {
    const sessionPausedEvent = event as SessionPaused;

    await this.store.update("LATEST", {
      status: "paused",
      updatedAt: sessionPausedEvent.timestamp,
    });
  }

  /**
   * SessionResumed → Update LATEST status
   */
  private async handleSessionResumed(event: BaseEvent): Promise<void> {
    const sessionResumedEvent = event as SessionResumed;

    await this.store.update("LATEST", {
      status: "active",
      updatedAt: sessionResumedEvent.timestamp,
    });
  }

  /**
   * GoalCompletedEvent → Append to LATEST completedGoals
   *
   * Data Enrichment:
   * - Event only contains goalId
   * - Query goal projection store to get objective
   * - Append enriched reference to session summary
   */
  private async handleGoalCompleted(event: BaseEvent): Promise<void> {
    const goalCompletedEvent = event as GoalCompletedEvent;

    // Defensive check: Only update if LATEST exists and is active
    const latestSessionSummary = await this.store.findLatest();
    if (!latestSessionSummary || latestSessionSummary.status !== "active") {
      // No active session - skip
      return;
    }

    // Enrich event data by querying goal projection for objective
    const goal = await this.goalReader.findById(
      goalCompletedEvent.aggregateId
    );

    if (!goal) {
      // Goal not found in projection store - skip gracefully
      // This can happen if projection rebuild is in progress
      return;
    }

    // Append enriched goal reference to session summary
    await this.store.addCompletedGoal({
      goalId: goalCompletedEvent.aggregateId,
      objective: goal.objective,
      status: goal.status,
      createdAt: goal.createdAt,
    });
  }

  /**
   * GoalBlockedEvent → Append to LATEST blockersEncountered
   *
   * Data Enrichment:
   * - Event only contains goalId
   * - Query goal projection store to get block reason
   * - Append enriched reference to session summary
   */
  private async handleGoalBlocked(event: BaseEvent): Promise<void> {
    const goalBlockedEvent = event as GoalBlockedEvent;

    // Defensive check: Only update if LATEST exists and is active
    const latestSessionSummary = await this.store.findLatest();
    if (!latestSessionSummary || latestSessionSummary.status !== "active") {
      // No active session - skip
      return;
    }

    // Enrich event data by querying goal projection for reason
    const goal = await this.goalReader.findById(
      goalBlockedEvent.aggregateId
    );

    if (!goal) {
      // Goal not found - skip gracefully
      return;
    }

    // Append enriched blocker reference to session summary
    await this.store.addBlocker({
      goalId: goalBlockedEvent.aggregateId,
      reason: goal.note || "Unknown reason",
    });
  }

  /**
   * DecisionAdded → Append to LATEST decisions
   *
   * Data Enrichment:
   * - Event contains all necessary data in payload
   * - Extract title and rationale from event
   * - Append to session summary
   */
  private async handleDecisionAdded(event: BaseEvent): Promise<void> {
    const decisionAddedEvent = event as DecisionAdded;

    // Defensive check: Only update if LATEST exists and is active
    const latestSessionSummary = await this.store.findLatest();
    if (!latestSessionSummary || latestSessionSummary.status !== "active") {
      // No active session - skip
      return;
    }

    // Enrich event data by querying decision projection
    const decision = await this.decisionReader.findById(
      decisionAddedEvent.aggregateId
    );

    if (!decision) {
      // Decision not found - skip gracefully
      return;
    }

    // Append enriched decision reference to session summary
    await this.store.addDecision({
      decisionId: decisionAddedEvent.aggregateId,
      title: decision.title,
      rationale: decision.rationale || "",
    });
  }
}
