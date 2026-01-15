/**
 * Tests for ResumeGoalCommandHandler (command handler)
 */

import { ResumeGoalCommandHandler } from "../../../../../src/application/work/goals/resume/ResumeGoalCommandHandler";
import { ResumeGoalCommand } from "../../../../../src/application/work/goals/resume/ResumeGoalCommand";
import { IGoalResumedEventWriter } from "../../../../../src/application/work/goals/resume/IGoalResumedEventWriter";
import { IGoalResumedEventReader } from "../../../../../src/application/work/goals/resume/IGoalResumedEventReader";
import { IGoalReader } from "../../../../../src/application/work/goals/resume/IGoalReader";
import { IEventBus } from "../../../../../src/application/shared/messaging/IEventBus";
import { GoalEventType, GoalStatus } from "../../../../../src/domain/work/goals/Constants";
import { GoalView } from "../../../../../src/application/work/goals/GoalView";

describe("ResumeGoalCommandHandler", () => {
  let eventWriter: IGoalResumedEventWriter;
  let eventReader: IGoalResumedEventReader;
  let goalReader: IGoalReader;
  let eventBus: IEventBus;
  let handler: ResumeGoalCommandHandler;

  beforeEach(() => {
    // Mock event writer
    eventWriter = {
      append: jest.fn().mockResolvedValue({ nextSeq: 4 }),
    };

    // Mock event reader
    eventReader = {
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

    handler = new ResumeGoalCommandHandler(eventWriter, eventReader, goalReader, eventBus);
  });

  it("should resume goal and publish GoalResumedEvent", async () => {
    // Arrange
    const command: ResumeGoalCommand = {
      goalId: "goal_123",
    };

    // Mock projection exists
    const mockView: GoalView = {
      goalId: "goal_123",
      objective: "Implement authentication",
      successCriteria: ["Users can log in"],
      scopeIn: [],
      scopeOut: [],
      boundaries: [],
      status: GoalStatus.PAUSED,
      version: 3,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    };
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

    // Mock event history (GoalAddedEvent, GoalStartedEvent, GoalPausedEvent)
    const mockHistory = [
      {
        type: GoalEventType.ADDED,
        aggregateId: "goal_123",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          objective: "Implement authentication",
          successCriteria: ["Users can log in"],
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
          reason: "ContextCompressed",
        },
      },
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.goalId).toBe("goal_123");

    // Verify event was appended to event store
    expect(eventWriter.append).toHaveBeenCalledTimes(1);
    const appendedEvent = (eventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.type).toBe(GoalEventType.RESUMED);
    expect(appendedEvent.aggregateId).toBe("goal_123");
    expect(appendedEvent.version).toBe(4);
    expect(appendedEvent.payload.status).toBe(GoalStatus.DOING);

    // Verify event was published to event bus
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const publishedEvent = (eventBus.publish as jest.Mock).mock.calls[0][0];
    expect(publishedEvent.type).toBe(GoalEventType.RESUMED);
    expect(publishedEvent.aggregateId).toBe("goal_123");
  });

  it("should resume goal with optional note", async () => {
    // Arrange
    const command: ResumeGoalCommand = {
      goalId: "goal_456",
      note: "Ready to continue",
    };

    // Mock projection exists
    const mockView: GoalView = {
      goalId: "goal_456",
      objective: "Fix bug",
      successCriteria: ["Bug resolved"],
      scopeIn: [],
      scopeOut: [],
      boundaries: [],
      status: GoalStatus.PAUSED,
      version: 3,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    };
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

    // Mock event history
    const mockHistory = [
      {
        type: GoalEventType.ADDED,
        aggregateId: "goal_456",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          objective: "Fix bug",
          successCriteria: ["Bug resolved"],
          scopeIn: [],
          scopeOut: [],
          boundaries: [],
          status: GoalStatus.TODO,
        },
      },
      {
        type: GoalEventType.STARTED,
        aggregateId: "goal_456",
        version: 2,
        timestamp: "2025-01-01T01:00:00Z",
        payload: {
          status: GoalStatus.DOING,
        },
      },
      {
        type: GoalEventType.PAUSED,
        aggregateId: "goal_456",
        version: 3,
        timestamp: "2025-01-01T02:00:00Z",
        payload: {
          status: GoalStatus.PAUSED,
          reason: "Other",
        },
      },
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.goalId).toBe("goal_456");
    const appendedEvent = (eventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.payload.note).toBe("Ready to continue");
  });

  it("should throw error if goal not found", async () => {
    // Arrange
    const command: ResumeGoalCommand = {
      goalId: "nonexistent",
    };

    // Mock projection not found
    (goalReader.findById as jest.Mock).mockResolvedValue(null);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(
      "Goal not found: nonexistent"
    );
  });

  it("should propagate validation error if goal not paused", async () => {
    // Arrange
    const command: ResumeGoalCommand = {
      goalId: "goal_789",
    };

    // Mock projection exists (doing status)
    const mockView: GoalView = {
      goalId: "goal_789",
      objective: "Already active goal",
      successCriteria: ["Criterion"],
      scopeIn: [],
      scopeOut: [],
      boundaries: [],
      status: GoalStatus.DOING,
      version: 2,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    };
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

    // Mock event history (GoalAddedEvent, GoalStartedEvent)
    const mockHistory = [
      {
        type: GoalEventType.ADDED,
        aggregateId: "goal_789",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          objective: "Already active goal",
          successCriteria: ["Criterion"],
          scopeIn: [],
          scopeOut: [],
          boundaries: [],
          status: GoalStatus.TODO,
        },
      },
      {
        type: GoalEventType.STARTED,
        aggregateId: "goal_789",
        version: 2,
        timestamp: "2025-01-01T01:00:00Z",
        payload: {
          status: GoalStatus.DOING,
        },
      },
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(
      "Cannot resume goal in doing status"
    );
  });

  it("should propagate errors if event store fails", async () => {
    // Arrange
    const command: ResumeGoalCommand = {
      goalId: "goal_123",
    };

    // Mock projection exists
    const mockView: GoalView = {
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
    };
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

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
          reason: "ContextCompressed",
        },
      },
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Mock event store failure
    (eventWriter.append as jest.Mock).mockRejectedValue(
      new Error("Event store failure")
    );

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow("Event store failure");
  });
});
