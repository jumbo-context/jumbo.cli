/**
 * Tests for CompleteGoalCommandHandler (command handler)
 */

import { CompleteGoalCommandHandler } from "../../../../../src/application/work/goals/complete/CompleteGoalCommandHandler";
import { CompleteGoalCommand } from "../../../../../src/application/work/goals/complete/CompleteGoalCommand";
import { IGoalCompletedEventWriter } from "../../../../../src/application/work/goals/complete/IGoalCompletedEventWriter";
import { IGoalCompletedEventReader } from "../../../../../src/application/work/goals/complete/IGoalCompletedEventReader";
import { IGoalCompleteReader } from "../../../../../src/application/work/goals/complete/IGoalCompleteReader";
import { IEventBus } from "../../../../../src/application/shared/messaging/IEventBus";
import { GoalEventType, GoalStatus } from "../../../../../src/domain/work/goals/Constants";
import { GoalView } from "../../../../../src/application/work/goals/GoalView";

describe("CompleteGoalCommandHandler", () => {
  let eventWriter: IGoalCompletedEventWriter;
  let eventReader: IGoalCompletedEventReader;
  let goalReader: IGoalCompleteReader;
  let eventBus: IEventBus;
  let handler: CompleteGoalCommandHandler;

  beforeEach(() => {
    // Mock event writer
    eventWriter = {
      append: jest.fn().mockResolvedValue({ nextSeq: 3 }),
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

    handler = new CompleteGoalCommandHandler(eventWriter, eventReader, goalReader, eventBus);
  });

  it("should complete goal and publish GoalCompletedEvent event", async () => {
    // Arrange
    const command: CompleteGoalCommand = {
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
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.goalId).toBe("goal_123");

    // Verify event was appended to event store
    expect(eventWriter.append).toHaveBeenCalledTimes(1);
    const appendedEvent = (eventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.type).toBe(GoalEventType.COMPLETED);
    expect(appendedEvent.aggregateId).toBe("goal_123");
    expect(appendedEvent.version).toBe(3);
    expect(appendedEvent.payload.status).toBe(GoalStatus.COMPLETED);

    // Verify event was published to event bus
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const publishedEvent = (eventBus.publish as jest.Mock).mock.calls[0][0];
    expect(publishedEvent.type).toBe(GoalEventType.COMPLETED);
    expect(publishedEvent.aggregateId).toBe("goal_123");
  });

  it("should complete goal from blocked status", async () => {
    // Arrange
    const command: CompleteGoalCommand = {
      goalId: "goal_456",
    };

    // Mock projection exists (blocked status)
    const mockView: GoalView = {
      goalId: "goal_456",
      objective: "Fix critical bug",
      successCriteria: ["Bug is resolved"],
      scopeIn: [],
      scopeOut: [],
      boundaries: [],
      status: GoalStatus.BLOCKED,
      version: 3,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      note: "Waiting for dependencies",
    };
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

    // Mock event history (GoalAddedEvent, GoalStartedEvent, GoalBlockedEvent)
    const mockHistory = [
      {
        type: GoalEventType.ADDED,
        aggregateId: "goal_456",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          objective: "Fix critical bug",
          successCriteria: ["Bug is resolved"],
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
        type: GoalEventType.BLOCKED,
        aggregateId: "goal_456",
        version: 3,
        timestamp: "2025-01-01T02:00:00Z",
        payload: {
          status: GoalStatus.BLOCKED,
          note: "Waiting for dependencies",
        },
      },
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.goalId).toBe("goal_456");

    // Verify event was appended
    const appendedEvent = (eventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.type).toBe(GoalEventType.COMPLETED);
    expect(appendedEvent.version).toBe(4);
  });

  it("should throw error if goal not found", async () => {
    // Arrange
    const command: CompleteGoalCommand = {
      goalId: "nonexistent",
    };

    // Mock projection not found
    (goalReader.findById as jest.Mock).mockResolvedValue(null);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(
      "Goal not found: nonexistent"
    );
  });

  it("should propagate validation error if goal not started", async () => {
    // Arrange
    const command: CompleteGoalCommand = {
      goalId: "goal_789",
    };

    // Mock projection exists (to-do status)
    const mockView: GoalView = {
      goalId: "goal_789",
      objective: "Not started goal",
      successCriteria: ["Criterion"],
      scopeIn: [],
      scopeOut: [],
      boundaries: [],
      status: GoalStatus.TODO,
      version: 1,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    };
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

    // Mock event history (only GoalAddedEvent)
    const mockHistory = [
      {
        type: GoalEventType.ADDED,
        aggregateId: "goal_789",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          objective: "Not started goal",
          successCriteria: ["Criterion"],
          scopeIn: [],
          scopeOut: [],
          boundaries: [],
          status: GoalStatus.TODO,
        },
      },
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(
      "Cannot complete a goal that has not been started"
    );
  });

  it("should propagate validation error if goal already completed", async () => {
    // Arrange
    const command: CompleteGoalCommand = {
      goalId: "goal_999",
    };

    // Mock projection exists (completed status)
    const mockView: GoalView = {
      goalId: "goal_999",
      objective: "Already completed",
      successCriteria: ["Criterion"],
      scopeIn: [],
      scopeOut: [],
      boundaries: [],
      status: GoalStatus.COMPLETED,
      version: 3,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    };
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

    // Mock event history (GoalAddedEvent, GoalStartedEvent, GoalCompletedEvent)
    const mockHistory = [
      {
        type: GoalEventType.ADDED,
        aggregateId: "goal_999",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          objective: "Already completed",
          successCriteria: ["Criterion"],
          scopeIn: [],
          scopeOut: [],
          boundaries: [],
          status: GoalStatus.TODO,
        },
      },
      {
        type: GoalEventType.STARTED,
        aggregateId: "goal_999",
        version: 2,
        timestamp: "2025-01-01T01:00:00Z",
        payload: {
          status: GoalStatus.DOING,
        },
      },
      {
        type: GoalEventType.COMPLETED,
        aggregateId: "goal_999",
        version: 3,
        timestamp: "2025-01-01T02:00:00Z",
        payload: {
          status: GoalStatus.COMPLETED,
        },
      },
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(
      "Goal is already completed"
    );
  });

  it("should propagate errors if event store fails", async () => {
    // Arrange
    const command: CompleteGoalCommand = {
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
      status: GoalStatus.DOING,
      version: 2,
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
