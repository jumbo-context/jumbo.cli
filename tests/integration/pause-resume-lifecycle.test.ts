/**
 * Integration test for goal pause/resume lifecycle
 * Tests the full stack: command handlers, domain logic, event persistence, and projections
 */

import * as fs from "fs-extra";
import * as path from "path";
import {
  bootstrap,
  ApplicationContainer,
} from "../../src/presentation/cli/composition/bootstrap.js";
import { AddGoalCommandHandler } from "../../src/application/work/goals/add/AddGoalCommandHandler.js";
import { AddGoalCommand } from "../../src/application/work/goals/add/AddGoalCommand.js";
import { StartGoalCommandHandler } from "../../src/application/work/goals/start/StartGoalCommandHandler.js";
import { StartGoalCommand } from "../../src/application/work/goals/start/StartGoalCommand.js";
import { PauseGoalCommandHandler } from "../../src/application/work/goals/pause/PauseGoalCommandHandler.js";
import { PauseGoalCommand } from "../../src/application/work/goals/pause/PauseGoalCommand.js";
import { ResumeGoalCommandHandler } from "../../src/application/work/goals/resume/ResumeGoalCommandHandler.js";
import { ResumeGoalCommand } from "../../src/application/work/goals/resume/ResumeGoalCommand.js";
import { CompleteGoalCommandHandler } from "../../src/application/work/goals/complete/CompleteGoalCommandHandler.js";
import { CompleteGoalCommand } from "../../src/application/work/goals/complete/CompleteGoalCommand.js";
import { GoalStatus, GoalEventType } from "../../src/domain/work/goals/Constants.js";

describe("Pause-Resume Lifecycle Integration", () => {
  let tmpDir: string;
  let container: ApplicationContainer;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(process.cwd(), "test-pause-resume-"));
    container = bootstrap(tmpDir);
  });

  afterEach(async () => {
    // LocalInfrastructureModule handles cleanup via signal handlers in production.
    // For tests, we need to manually close the db connection since the process doesn't exit.
    const db = container.db;
    if (db && db.open) {
      db.pragma("wal_checkpoint(TRUNCATE)");
      db.close();
    }
    // Wait for Windows to release file locks on WAL files
    await new Promise((resolve) => setTimeout(resolve, 100));
    await fs.remove(tmpDir);
  });

  it("full lifecycle: create → start → pause → resume → complete", async () => {
    // 1. Add goal
    const addHandler = new AddGoalCommandHandler(
      container.goalAddedEventStore,
      container.eventBus
    );
    const addCommand: AddGoalCommand = {
      objective: "Test pause/resume lifecycle",
      successCriteria: ["Lifecycle works correctly"],
    };
    const addResult = await addHandler.execute(addCommand);
    const goalId = addResult.goalId;

    // Verify projection after add
    let view = await container.goalStartedProjector.findById(goalId);
    expect(view).toBeDefined();
    expect(view!.status).toBe(GoalStatus.TODO);
    expect(view!.version).toBe(1);

    // 2. Start goal
    const startHandler = new StartGoalCommandHandler(
      container.goalStartedEventStore,
      container.goalStartedEventStore,
      container.goalStartedProjector,
      container.eventBus
    );
    const startCommand: StartGoalCommand = {
      goalId,
    };
    await startHandler.execute(startCommand);

    // Verify projection after start
    view = await container.goalStartedProjector.findById(goalId);
    expect(view!.status).toBe(GoalStatus.DOING);
    expect(view!.version).toBe(2);

    // 3. Pause goal
    const pauseHandler = new PauseGoalCommandHandler(
      container.goalPausedEventStore,
      container.goalPausedEventStore,
      container.goalPausedProjector,
      container.eventBus
    );
    const pauseCommand: PauseGoalCommand = {
      goalId,
      reason: "ContextCompressed",
      note: "Testing pause functionality",
    };
    await pauseHandler.execute(pauseCommand);

    // Verify projection after pause
    view = await container.goalPausedProjector.findById(goalId);
    expect(view!.status).toBe(GoalStatus.PAUSED);
    expect(view!.note).toBe("Testing pause functionality");
    expect(view!.version).toBe(3);

    // 4. Resume goal
    const resumeHandler = new ResumeGoalCommandHandler(
      container.goalResumedEventStore,
      container.goalResumedEventStore,
      container.goalResumedProjector,
      container.eventBus
    );
    const resumeCommand: ResumeGoalCommand = {
      goalId,
      note: "Testing resume functionality",
    };
    await resumeHandler.execute(resumeCommand);

    // Verify projection after resume
    view = await container.goalResumedProjector.findById(goalId);
    expect(view!.status).toBe(GoalStatus.DOING);
    expect(view!.note).toBe("Testing resume functionality");
    expect(view!.version).toBe(4);

    // 5. Complete goal
    const completeHandler = new CompleteGoalCommandHandler(
      container.goalCompletedEventStore,
      container.goalCompletedEventStore,
      container.goalCompletedProjector,
      container.eventBus
    );
    const completeCommand: CompleteGoalCommand = {
      goalId,
    };
    await completeHandler.execute(completeCommand);

    // Verify projection after complete
    view = await container.goalCompletedProjector.findById(goalId);
    expect(view!.status).toBe(GoalStatus.COMPLETED);
    expect(view!.version).toBe(5);

    // Verify event stream correctness
    const events = await container.eventStore.readStream(goalId);
    expect(events).toHaveLength(5);
    expect(events[0].type).toBe(GoalEventType.ADDED);
    expect(events[1].type).toBe(GoalEventType.STARTED);
    expect(events[2].type).toBe(GoalEventType.PAUSED);
    expect(events[3].type).toBe(GoalEventType.RESUMED);
    expect(events[4].type).toBe(GoalEventType.COMPLETED);

    // Verify all events persisted to file system
    const eventsDir = path.join(tmpDir, "events", goalId);
    const files = await fs.readdir(eventsDir);
    expect(files).toHaveLength(5);
    expect(files).toContain("000001.GoalAddedEvent.json");
    expect(files).toContain("000002.GoalStartedEvent.json");
    expect(files).toContain("000003.GoalPausedEvent.json");
    expect(files).toContain("000004.GoalResumedEvent.json");
    expect(files).toContain("000005.GoalCompletedEvent.json");
  });

  it("pause event contains reason and note", async () => {
    // Setup: create and start goal
    const addHandler = new AddGoalCommandHandler(
      container.goalAddedEventStore,
      container.eventBus
    );
    const addResult = await addHandler.execute({
      objective: "Test pause details",
      successCriteria: ["Works"],
    });
    const goalId = addResult.goalId;

    const startHandler = new StartGoalCommandHandler(
      container.goalStartedEventStore,
      container.goalStartedEventStore,
      container.goalStartedProjector,
      container.eventBus
    );
    await startHandler.execute({ goalId });

    // Pause with reason and note
    const pauseHandler = new PauseGoalCommandHandler(
      container.goalPausedEventStore,
      container.goalPausedEventStore,
      container.goalPausedProjector,
      container.eventBus
    );
    await pauseHandler.execute({
      goalId,
      reason: "Other",
      note: "Need to switch priorities",
    });

    // Verify event stream includes reason and note
    const events = await container.eventStore.readStream(goalId);
    const pausedEvent = events.find((e) => e.type === GoalEventType.PAUSED);
    expect(pausedEvent).toBeDefined();
    expect((pausedEvent as any).payload.reason).toBe("Other");
    expect((pausedEvent as any).payload.note).toBe("Need to switch priorities");
  });

  it("can pause and resume multiple times", async () => {
    // Setup: create and start goal
    const addHandler = new AddGoalCommandHandler(
      container.goalAddedEventStore,
      container.eventBus
    );
    const addResult = await addHandler.execute({
      objective: "Test multiple pause/resume",
      successCriteria: ["Works"],
    });
    const goalId = addResult.goalId;

    const startHandler = new StartGoalCommandHandler(
      container.goalStartedEventStore,
      container.goalStartedEventStore,
      container.goalStartedProjector,
      container.eventBus
    );
    await startHandler.execute({ goalId });

    const pauseHandler = new PauseGoalCommandHandler(
      container.goalPausedEventStore,
      container.goalPausedEventStore,
      container.goalPausedProjector,
      container.eventBus
    );

    const resumeHandler = new ResumeGoalCommandHandler(
      container.goalResumedEventStore,
      container.goalResumedEventStore,
      container.goalResumedProjector,
      container.eventBus
    );

    // First pause/resume cycle
    await pauseHandler.execute({ goalId, reason: "ContextCompressed" });
    let view = await container.goalPausedProjector.findById(goalId);
    expect(view!.status).toBe(GoalStatus.PAUSED);

    await resumeHandler.execute({ goalId });
    view = await container.goalResumedProjector.findById(goalId);
    expect(view!.status).toBe(GoalStatus.DOING);

    // Second pause/resume cycle
    await pauseHandler.execute({ goalId, reason: "Other" });
    view = await container.goalPausedProjector.findById(goalId);
    expect(view!.status).toBe(GoalStatus.PAUSED);

    await resumeHandler.execute({ goalId });
    view = await container.goalResumedProjector.findById(goalId);
    expect(view!.status).toBe(GoalStatus.DOING);

    // Verify event stream has all events
    const events = await container.eventStore.readStream(goalId);
    expect(events).toHaveLength(6); // add, start, pause, resume, pause, resume
    const pausedEvents = events.filter((e) => e.type === GoalEventType.PAUSED);
    const resumedEvents = events.filter((e) => e.type === GoalEventType.RESUMED);
    expect(pausedEvents).toHaveLength(2);
    expect(resumedEvents).toHaveLength(2);
  });

  it("projection stays consistent with event stream", async () => {
    // Create full lifecycle
    const addHandler = new AddGoalCommandHandler(
      container.goalAddedEventStore,
      container.eventBus
    );
    const addResult = await addHandler.execute({
      objective: "Test projection consistency",
      successCriteria: ["Consistent"],
    });
    const goalId = addResult.goalId;

    const startHandler = new StartGoalCommandHandler(
      container.goalStartedEventStore,
      container.goalStartedEventStore,
      container.goalStartedProjector,
      container.eventBus
    );
    await startHandler.execute({ goalId });

    const pauseHandler = new PauseGoalCommandHandler(
      container.goalPausedEventStore,
      container.goalPausedEventStore,
      container.goalPausedProjector,
      container.eventBus
    );
    await pauseHandler.execute({ goalId, reason: "ContextCompressed" });

    const resumeHandler = new ResumeGoalCommandHandler(
      container.goalResumedEventStore,
      container.goalResumedEventStore,
      container.goalResumedProjector,
      container.eventBus
    );
    await resumeHandler.execute({ goalId });

    // Read projection
    const view = await container.goalResumedProjector.findById(goalId);

    // Read event stream and reconstruct state
    const events = await container.eventStore.readStream(goalId);
    expect(events).toHaveLength(4);

    // Projection version should match latest event version
    expect(view!.version).toBe(events[events.length - 1].version);
    expect(view!.status).toBe(GoalStatus.DOING);
  });
});
