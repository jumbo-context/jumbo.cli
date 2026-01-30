/**
 * Tests for ResumeWorkCommandHandler (work-level command handler)
 */

import { ResumeWorkCommandHandler } from "../../../../../src/application/work/resume/ResumeWorkCommandHandler";
import { IWorkerIdentityReader } from "../../../../../src/application/host/workers/IWorkerIdentityReader";
import { IGoalStatusReader } from "../../../../../src/application/work/goals/IGoalStatusReader";
import { IGoalResumedEventWriter } from "../../../../../src/application/work/goals/resume/IGoalResumedEventWriter";
import { IGoalResumedEventReader } from "../../../../../src/application/work/goals/resume/IGoalResumedEventReader";
import { IGoalReader } from "../../../../../src/application/work/goals/resume/IGoalReader";
import { IEventBus } from "../../../../../src/application/shared/messaging/IEventBus";
import { GoalClaimPolicy } from "../../../../../src/application/work/goals/claims/GoalClaimPolicy";
import { ISettingsReader } from "../../../../../src/application/shared/settings/ISettingsReader";
import { GoalEventType, GoalStatus } from "../../../../../src/domain/work/goals/Constants";
import { GoalPausedReasons } from "../../../../../src/domain/work/goals/GoalPausedReasons";
import { GoalView } from "../../../../../src/application/work/goals/GoalView";
import { createWorkerId } from "../../../../../src/application/host/workers/WorkerId";

describe("ResumeWorkCommandHandler", () => {
  let workerIdentityReader: IWorkerIdentityReader;
  let goalStatusReader: IGoalStatusReader;
  let goalResumedEventWriter: IGoalResumedEventWriter;
  let goalResumedEventReader: IGoalResumedEventReader;
  let goalReader: IGoalReader;
  let eventBus: IEventBus;
  let claimPolicy: GoalClaimPolicy;
  let settingsReader: ISettingsReader;
  let handler: ResumeWorkCommandHandler;

  const workerId = createWorkerId("worker_123");

  beforeEach(() => {
    // Mock worker identity reader
    workerIdentityReader = {
      workerId,
    };

    // Mock goal status reader
    goalStatusReader = {
      findByStatus: jest.fn(),
      findAll: jest.fn(),
    };

    // Mock event writer
    goalResumedEventWriter = {
      append: jest.fn().mockResolvedValue({ nextSeq: 4 }),
    };

    // Mock event reader
    goalResumedEventReader = {
      readStream: jest.fn(),
    };

    // Mock goal reader
    goalReader = {
      findById: jest.fn(),
    };

    // Mock event bus
    eventBus = {
      subscribe: jest.fn(),
      publish: jest.fn().mockResolvedValue(undefined),
    };

    // Mock claim policy
    claimPolicy = {
      canClaim: jest.fn().mockReturnValue({ allowed: true }),
      prepareRefreshedClaim: jest.fn().mockReturnValue({
        goalId: "goal_123",
        claimedBy: workerId,
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      }),
      storeClaim: jest.fn(),
    } as unknown as GoalClaimPolicy;

    // Mock settings reader
    settingsReader = {
      read: jest.fn().mockResolvedValue({
        claims: { claimDurationMinutes: 60 },
      }),
    } as unknown as ISettingsReader;

    handler = new ResumeWorkCommandHandler(
      workerIdentityReader,
      goalStatusReader,
      goalResumedEventWriter,
      goalResumedEventReader,
      goalReader,
      eventBus,
      claimPolicy,
      settingsReader
    );
  });

  it("should resume the paused goal claimed by current worker", async () => {
    // Arrange
    const pausedGoal: GoalView = {
      goalId: "goal_123",
      objective: "Implement feature",
      successCriteria: ["Feature works"],
      scopeIn: [],
      scopeOut: [],
      boundaries: [],
      status: GoalStatus.PAUSED,
      version: 3,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      claimedBy: workerId,
      progress: [],
    };

    (goalStatusReader.findByStatus as jest.Mock).mockResolvedValue([pausedGoal]);
    (goalReader.findById as jest.Mock).mockResolvedValue(pausedGoal);

    // Mock event history for ResumeGoalCommandHandler
    const mockHistory = [
      {
        type: GoalEventType.ADDED,
        aggregateId: "goal_123",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          objective: "Implement feature",
          successCriteria: ["Feature works"],
          scopeIn: [],
          scopeOut: [],
          boundaries: [],
          status: GoalStatus.TODO,
        },
      },
      {
        type: GoalEventType.STARTED,
        aggregateId: "goal_123",
        version: 2,
        timestamp: "2025-01-01T01:00:00Z",
        payload: {
          status: GoalStatus.DOING,
        },
      },
      {
        type: GoalEventType.PAUSED,
        aggregateId: "goal_123",
        version: 3,
        timestamp: "2025-01-01T02:00:00Z",
        payload: {
          status: GoalStatus.PAUSED,
          reason: GoalPausedReasons.WorkPaused,
        },
      },
    ];
    (goalResumedEventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Act
    const result = await handler.execute({});

    // Assert
    expect(result.goalId).toBe("goal_123");
    expect(result.objective).toBe("Implement feature");
    expect(goalStatusReader.findByStatus).toHaveBeenCalledWith(GoalStatus.PAUSED);

    // Verify resume event was created
    const appendedEvent = (goalResumedEventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.type).toBe(GoalEventType.RESUMED);
    expect(appendedEvent.payload.status).toBe(GoalStatus.DOING);
  });

  it("should throw error when no paused goal found for worker", async () => {
    // Arrange - no goals in paused status
    (goalStatusReader.findByStatus as jest.Mock).mockResolvedValue([]);

    // Act & Assert
    await expect(handler.execute({})).rejects.toThrow(
      "No paused goal found for current worker"
    );
  });

  it("should throw error when paused goals exist but none claimed by current worker", async () => {
    // Arrange - goals exist but claimed by different worker
    const otherWorkerGoal: GoalView = {
      goalId: "goal_456",
      objective: "Other worker's goal",
      successCriteria: ["Criterion"],
      scopeIn: [],
      scopeOut: [],
      boundaries: [],
      status: GoalStatus.PAUSED,
      version: 3,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      claimedBy: "other_worker_id",
      progress: [],
    };

    (goalStatusReader.findByStatus as jest.Mock).mockResolvedValue([otherWorkerGoal]);

    // Act & Assert
    await expect(handler.execute({})).rejects.toThrow(
      "No paused goal found for current worker"
    );
  });

  it("should select correct goal when multiple paused goals exist", async () => {
    // Arrange - multiple goals, only one claimed by current worker
    const otherWorkerGoal: GoalView = {
      goalId: "goal_other",
      objective: "Other worker's goal",
      successCriteria: ["Criterion"],
      scopeIn: [],
      scopeOut: [],
      boundaries: [],
      status: GoalStatus.PAUSED,
      version: 3,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      claimedBy: "other_worker_id",
      progress: [],
    };

    const myGoal: GoalView = {
      goalId: "goal_mine",
      objective: "My paused goal",
      successCriteria: ["Criterion"],
      scopeIn: [],
      scopeOut: [],
      boundaries: [],
      status: GoalStatus.PAUSED,
      version: 3,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      claimedBy: workerId,
      progress: [],
    };

    (goalStatusReader.findByStatus as jest.Mock).mockResolvedValue([otherWorkerGoal, myGoal]);
    (goalReader.findById as jest.Mock).mockResolvedValue(myGoal);

    // Mock event history
    const mockHistory = [
      {
        type: GoalEventType.ADDED,
        aggregateId: "goal_mine",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          objective: "My paused goal",
          successCriteria: ["Criterion"],
          scopeIn: [],
          scopeOut: [],
          boundaries: [],
          status: GoalStatus.TODO,
        },
      },
      {
        type: GoalEventType.STARTED,
        aggregateId: "goal_mine",
        version: 2,
        timestamp: "2025-01-01T01:00:00Z",
        payload: {
          status: GoalStatus.DOING,
        },
      },
      {
        type: GoalEventType.PAUSED,
        aggregateId: "goal_mine",
        version: 3,
        timestamp: "2025-01-01T02:00:00Z",
        payload: {
          status: GoalStatus.PAUSED,
          reason: GoalPausedReasons.WorkPaused,
        },
      },
    ];
    (goalResumedEventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Act
    const result = await handler.execute({});

    // Assert
    expect(result.goalId).toBe("goal_mine");
    expect(result.objective).toBe("My paused goal");
  });

  it("should propagate errors from ResumeGoalCommandHandler", async () => {
    // Arrange
    const pausedGoal: GoalView = {
      goalId: "goal_123",
      objective: "Test goal",
      successCriteria: ["Criterion"],
      scopeIn: [],
      scopeOut: [],
      boundaries: [],
      status: GoalStatus.PAUSED,
      version: 3,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      claimedBy: workerId,
      progress: [],
    };

    (goalStatusReader.findByStatus as jest.Mock).mockResolvedValue([pausedGoal]);
    (goalReader.findById as jest.Mock).mockResolvedValue(pausedGoal);

    // Mock event history
    const mockHistory = [
      {
        type: GoalEventType.ADDED,
        aggregateId: "goal_123",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          objective: "Test goal",
          successCriteria: ["Criterion"],
          scopeIn: [],
          scopeOut: [],
          boundaries: [],
          status: GoalStatus.TODO,
        },
      },
      {
        type: GoalEventType.STARTED,
        aggregateId: "goal_123",
        version: 2,
        timestamp: "2025-01-01T01:00:00Z",
        payload: {
          status: GoalStatus.DOING,
        },
      },
      {
        type: GoalEventType.PAUSED,
        aggregateId: "goal_123",
        version: 3,
        timestamp: "2025-01-01T02:00:00Z",
        payload: {
          status: GoalStatus.PAUSED,
          reason: GoalPausedReasons.WorkPaused,
        },
      },
    ];
    (goalResumedEventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Mock event store failure
    (goalResumedEventWriter.append as jest.Mock).mockRejectedValue(
      new Error("Event store failure")
    );

    // Act & Assert
    await expect(handler.execute({})).rejects.toThrow("Event store failure");
  });

  it("should refresh claim when resuming goal", async () => {
    // Arrange
    const pausedGoal: GoalView = {
      goalId: "goal_123",
      objective: "Test goal",
      successCriteria: ["Criterion"],
      scopeIn: [],
      scopeOut: [],
      boundaries: [],
      status: GoalStatus.PAUSED,
      version: 3,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      claimedBy: workerId,
      progress: [],
    };

    (goalStatusReader.findByStatus as jest.Mock).mockResolvedValue([pausedGoal]);
    (goalReader.findById as jest.Mock).mockResolvedValue(pausedGoal);

    // Mock event history
    const mockHistory = [
      {
        type: GoalEventType.ADDED,
        aggregateId: "goal_123",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          objective: "Test goal",
          successCriteria: ["Criterion"],
          scopeIn: [],
          scopeOut: [],
          boundaries: [],
          status: GoalStatus.TODO,
        },
      },
      {
        type: GoalEventType.STARTED,
        aggregateId: "goal_123",
        version: 2,
        timestamp: "2025-01-01T01:00:00Z",
        payload: {
          status: GoalStatus.DOING,
        },
      },
      {
        type: GoalEventType.PAUSED,
        aggregateId: "goal_123",
        version: 3,
        timestamp: "2025-01-01T02:00:00Z",
        payload: {
          status: GoalStatus.PAUSED,
          reason: GoalPausedReasons.WorkPaused,
        },
      },
    ];
    (goalResumedEventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Act
    await handler.execute({});

    // Assert - verify claim was prepared and stored
    expect(claimPolicy.prepareRefreshedClaim).toHaveBeenCalled();
    expect(claimPolicy.storeClaim).toHaveBeenCalled();

    // Verify claim data embedded in event
    const appendedEvent = (goalResumedEventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.payload.claimedBy).toBe(workerId);
    expect(appendedEvent.payload.claimedAt).toBeDefined();
    expect(appendedEvent.payload.claimExpiresAt).toBeDefined();
  });
});
