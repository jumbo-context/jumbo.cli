/**
 * Tests for bootstrap composition root
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import fs from "fs-extra";
import path from "path";
import { bootstrap, ApplicationContainer } from "../../../../src/presentation/cli/composition/bootstrap.js";

describe("bootstrap", () => {
  const testRoot = path.join(process.cwd(), ".jumbo-test-bootstrap");
  let container: ApplicationContainer | null = null;

  beforeEach(async () => {
    // Clean up test directory
    await fs.remove(testRoot);
    await fs.ensureDir(testRoot);
    await fs.ensureDir(path.join(testRoot, "events"));
  });

  afterEach(async () => {
    // LocalInfrastructureModule handles cleanup via signal handlers in production.
    // For tests, we need to manually close the db connection since the process doesn't exit.
    if (container) {
      const db = container.db;
      if (db && db.open) {
        db.pragma("wal_checkpoint(TRUNCATE)");
        db.close();
      }
      container = null;
    }
    // Wait for Windows to release file locks on WAL files
    await new Promise((resolve) => setTimeout(resolve, 100));
    // Clean up test directory
    await fs.remove(testRoot);
  });

  it("should create a complete application container", () => {
    container = bootstrap(testRoot);

    // Verify core infrastructure
    expect(container.eventBus).toBeDefined();
    expect(container.eventStore).toBeDefined();
    expect(container.clock).toBeDefined();
    expect(container.db).toBeDefined();

    // Verify work category stores - Session Event Stores - decomposed by use case
    expect(container.sessionStartedEventStore).toBeDefined();
    expect(container.sessionEndedEventStore).toBeDefined();
    expect(container.sessionPausedEventStore).toBeDefined();
    expect(container.sessionResumedEventStore).toBeDefined();
    // Goal Event Stores - decomposed by use case
    expect(container.goalAddedEventStore).toBeDefined();
    expect(container.goalStartedEventStore).toBeDefined();
    expect(container.goalUpdatedEventStore).toBeDefined();
    expect(container.goalBlockedEventStore).toBeDefined();
    expect(container.goalUnblockedEventStore).toBeDefined();
    expect(container.goalCompletedEventStore).toBeDefined();
    expect(container.goalResetEventStore).toBeDefined();
    expect(container.goalRemovedEventStore).toBeDefined();
    // Session Projection Stores - decomposed by use case
    expect(container.sessionStartedProjector).toBeDefined();
    expect(container.sessionEndedProjector).toBeDefined();
    expect(container.activeSessionReader).toBeDefined();
    expect(container.sessionPausedProjector).toBeDefined();
    expect(container.sessionResumedProjector).toBeDefined();
    expect(container.sessionSummaryProjectionStore).toBeDefined();
    expect(container.sessionSummaryReader).toBeDefined();
    // Goal Projection Stores - decomposed by use case
    expect(container.goalAddedProjector).toBeDefined();
    expect(container.goalStartedProjector).toBeDefined();
    expect(container.goalUpdatedProjector).toBeDefined();
    expect(container.goalBlockedProjector).toBeDefined();
    expect(container.goalUnblockedProjector).toBeDefined();
    expect(container.goalCompletedProjector).toBeDefined();
    expect(container.goalResetProjector).toBeDefined();
    expect(container.goalRemovedProjector).toBeDefined();
    expect(container.goalContextReader).toBeDefined();
    expect(container.goalStatusReader).toBeDefined();

    // Verify solution category stores
    // Architecture Event Stores - decomposed by use case
    expect(container.architectureDefinedEventStore).toBeDefined();
    expect(container.architectureUpdatedEventStore).toBeDefined();
    // Component Event Stores - decomposed by use case
    expect(container.componentAddedEventStore).toBeDefined();
    expect(container.componentUpdatedEventStore).toBeDefined();
    expect(container.componentDeprecatedEventStore).toBeDefined();
    expect(container.componentRemovedEventStore).toBeDefined();
    // Dependency Event Stores - decomposed by use case
    expect(container.dependencyAddedEventStore).toBeDefined();
    expect(container.dependencyUpdatedEventStore).toBeDefined();
    expect(container.dependencyRemovedEventStore).toBeDefined();
    // Decision Event Stores - decomposed by use case
    expect(container.decisionAddedEventStore).toBeDefined();
    expect(container.decisionUpdatedEventStore).toBeDefined();
    expect(container.decisionReversedEventStore).toBeDefined();
    expect(container.decisionSupersededEventStore).toBeDefined();
    // Architecture Projection Stores - decomposed by use case
    expect(container.architectureDefinedProjector).toBeDefined();
    expect(container.architectureUpdatedProjector).toBeDefined();
    // Component Projection Stores - decomposed by use case
    expect(container.componentAddedProjector).toBeDefined();
    expect(container.componentUpdatedProjector).toBeDefined();
    expect(container.componentDeprecatedProjector).toBeDefined();
    expect(container.componentRemovedProjector).toBeDefined();
    expect(container.componentContextReader).toBeDefined();
    // Dependency Projection Stores - decomposed by use case
    expect(container.dependencyAddedProjector).toBeDefined();
    expect(container.dependencyUpdatedProjector).toBeDefined();
    expect(container.dependencyRemovedProjector).toBeDefined();
    expect(container.dependencyContextReader).toBeDefined();
    // Decision Projection Stores - decomposed by use case
    expect(container.decisionAddedProjector).toBeDefined();
    expect(container.decisionUpdatedProjector).toBeDefined();
    expect(container.decisionReversedProjector).toBeDefined();
    expect(container.decisionSupersededProjector).toBeDefined();
    expect(container.decisionContextReader).toBeDefined();
    expect(container.decisionSessionReader).toBeDefined();

    // Verify project knowledge category stores
    // Project Event Stores - decomposed by use case
    expect(container.projectInitializedEventStore).toBeDefined();
    expect(container.projectUpdatedEventStore).toBeDefined();
    // Project Projection Stores - decomposed by use case
    expect(container.projectInitializedProjector).toBeDefined();
    expect(container.projectUpdatedProjector).toBeDefined();
    expect(container.projectContextReader).toBeDefined();
    // Audience Event Stores - decomposed by use case
    expect(container.audienceAddedEventStore).toBeDefined();
    expect(container.audienceUpdatedEventStore).toBeDefined();
    expect(container.audienceRemovedEventStore).toBeDefined();
    // Audience Projection Stores - decomposed by use case
    expect(container.audienceAddedProjector).toBeDefined();
    expect(container.audienceUpdatedProjector).toBeDefined();
    expect(container.audienceRemovedProjector).toBeDefined();
    // AudiencePain Event Stores - decomposed by use case
    expect(container.audiencePainAddedEventStore).toBeDefined();
    expect(container.audiencePainUpdatedEventStore).toBeDefined();
    expect(container.audiencePainResolvedEventStore).toBeDefined();
    // AudiencePain Projection Stores - decomposed by use case
    expect(container.audiencePainAddedProjector).toBeDefined();
    expect(container.audiencePainUpdatedProjector).toBeDefined();
    expect(container.audiencePainResolvedProjector).toBeDefined();
    // ValueProposition Event Stores - decomposed by use case
    expect(container.valuePropositionAddedEventStore).toBeDefined();
    expect(container.valuePropositionUpdatedEventStore).toBeDefined();
    expect(container.valuePropositionRemovedEventStore).toBeDefined();
    // ValueProposition Projection Stores - decomposed by use case
    expect(container.valuePropositionAddedProjector).toBeDefined();
    expect(container.valuePropositionUpdatedProjector).toBeDefined();
    expect(container.valuePropositionRemovedProjector).toBeDefined();

    // Verify relations category stores - decomposed by use case
    expect(container.relationAddedEventStore).toBeDefined();
    expect(container.relationRemovedEventStore).toBeDefined();
    expect(container.relationAddedProjector).toBeDefined();
    expect(container.relationRemovedProjector).toBeDefined();
  });

  it("should NOT expose dbConnectionManager (lifecycle managed by LocalInfrastructureModule)", () => {
    container = bootstrap(testRoot);

    // Verify dbConnectionManager is NOT part of the container
    // This ensures presentation layer cannot call dispose()
    expect((container as any).dbConnectionManager).toBeUndefined();
  });

  it("should register all projection handlers with event bus", async () => {
    container = bootstrap(testRoot);

    // Create a test session event
    const sessionStartedEvent = {
      type: "SessionStartedEvent",
      aggregateId: "session_123",
      timestamp: new Date().toISOString(),
      version: 1,
      payload: {}, // Empty payload - focus set at session end
    };

    // Explicit append then publish (command handler pattern)
    await container.eventStore.append(sessionStartedEvent);
    await container.eventBus.publish(sessionStartedEvent);

    // Verify event was persisted
    const events = await container.eventStore.getAllEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("SessionStartedEvent");
    expect(events[0].aggregateId).toBe("session_123");

    // Verify event was handled by projection handler (session should be findable via active reader)
    const session = await container.activeSessionReader.findActive();
    expect(session).toBeDefined();
    expect(session?.sessionId).toBe("session_123");
    expect(session?.status).toBe("active");
  });

  it("should handle goal events through registered handlers", async () => {
    container = bootstrap(testRoot);

    // Create a test goal event
    const goalAddedEvent = {
      type: "GoalAddedEvent",
      aggregateId: "goal_456",
      timestamp: new Date().toISOString(),
      version: 1,
      payload: {
        objective: "Test goal",
        successCriteria: ["Criterion 1"],
        scopeIn: [],
        scopeOut: [],
        boundaries: [],
        status: "to-do" as const,
      },
    };

    // Explicit append then publish (command handler pattern)
    await container.eventStore.append(goalAddedEvent);
    await container.eventBus.publish(goalAddedEvent);

    // Verify event was persisted
    const events = await container.eventStore.getAllEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("GoalAddedEvent");

    // Verify event was handled by goal projection handler
    const goal = await container.goalStatusReader.findById("goal_456");
    expect(goal).toBeDefined();
    expect(goal?.objective).toBe("Test goal");
    expect(goal?.status).toBe("to-do");
  });

  it("should create database connection with proper tables", () => {
    container = bootstrap(testRoot);

    // Verify database was created
    const dbPath = path.join(testRoot, "jumbo.db");
    expect(fs.existsSync(dbPath)).toBe(true);

    // Verify session_views table exists (created by SqliteSessionProjectionStore migration)
    const tables = container.db
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all() as Array<{ name: string }>;

    const tableNames = tables.map((t) => t.name);
    expect(tableNames).toContain("session_views");
    expect(tableNames).toContain("goal_views");
  });

  it("should support cross-aggregate projections", async () => {
    container = bootstrap(testRoot);

    // Start a session
    const sessionEvent = {
      type: "SessionStartedEvent",
      aggregateId: "session_123",
      timestamp: new Date().toISOString(),
      version: 1,
      payload: {
        focus: "Cross-aggregate test",
        contextSnapshot: null,
      },
    };

    // Explicit append then publish (command handler pattern)
    await container.eventStore.append(sessionEvent);
    await container.eventBus.publish(sessionEvent);

    // Add a goal
    const goalEvent = {
      type: "GoalAddedEvent",
      aggregateId: "goal_789",
      timestamp: new Date().toISOString(),
      version: 1,
      payload: {
        objective: "Cross-aggregate goal",
        successCriteria: [],
        scopeIn: [],
        scopeOut: [],
        boundaries: [],
        status: "to-do" as const,
      },
    };

    await container.eventStore.append(goalEvent);
    await container.eventBus.publish(goalEvent);

    // Verify both projections were updated
    const session = await container.activeSessionReader.findActive();
    const goal = await container.goalStatusReader.findById("goal_789");

    expect(session).toBeDefined();
    expect(session?.sessionId).toBe("session_123");
    expect(goal).toBeDefined();

    // This demonstrates that cross-aggregate projections can subscribe to multiple event types
    // In Phase 3.3, SessionSummaryProjectionHandler will subscribe to both Session and Goal events
  });
});
