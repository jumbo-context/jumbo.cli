/**
 * Tests for SessionSummaryProjectionHandler
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { SessionSummaryProjectionHandler } from "../../../../../src/application/work/sessions/get-context/SessionSummaryProjectionHandler.js";
import { ISessionSummaryProjectionStore } from "../../../../../src/application/work/sessions/get-context/ISessionSummaryProjectionStore.js";
import { IGoalReadForSessionSummary } from "../../../../../src/application/work/sessions/get-context/IGoalReadForSessionSummary.js";
import { IDecisionSessionReader } from "../../../../../src/application/work/sessions/get-context/IDecisionSessionReader.js";
import { IEventBus } from "../../../../../src/application/shared/messaging/IEventBus.js";
import { SessionSummaryProjection } from "../../../../../src/application/work/sessions/SessionSummaryView.js";
import { GoalView } from "../../../../../src/application/work/goals/GoalView.js";
import { DecisionView } from "../../../../../src/application/solution/decisions/DecisionView.js";

describe("SessionSummaryProjectionHandler", () => {
  let handler: SessionSummaryProjectionHandler;
  let mockEventBus: jest.Mocked<IEventBus>;
  let mockStore: jest.Mocked<ISessionSummaryProjectionStore>;
  let mockGoalReader: jest.Mocked<IGoalReadForSessionSummary>;
  let mockDecisionReader: jest.Mocked<IDecisionSessionReader>;

  beforeEach(() => {
    // Create mocks
    mockEventBus = {
      subscribe: jest.fn(),
      publish: jest.fn(),
    } as any;

    mockStore = {
      upsertLatest: jest.fn(),
      archiveLatest: jest.fn(),
      update: jest.fn(),
      addCompletedGoal: jest.fn(),
      addBlocker: jest.fn(),
      addDecision: jest.fn(),
      findLatest: jest.fn(),
      findByOriginalId: jest.fn(),
    } as any;

    mockGoalReader = {
      findById: jest.fn(),
    } as any;

    mockDecisionReader = {
      findById: jest.fn(),
    } as any;

    // Create handler
    handler = new SessionSummaryProjectionHandler(
      mockEventBus,
      mockStore,
      mockGoalReader,
      mockDecisionReader
    );
  });

  describe("subscribe", () => {
    it("should subscribe to all relevant events", () => {
      handler.subscribe();

      expect(mockEventBus.subscribe).toHaveBeenCalledWith(
        "SessionStarted",
        expect.any(Object)
      );
      expect(mockEventBus.subscribe).toHaveBeenCalledWith(
        "SessionEnded",
        expect.any(Object)
      );
      expect(mockEventBus.subscribe).toHaveBeenCalledWith(
        "SessionPaused",
        expect.any(Object)
      );
      expect(mockEventBus.subscribe).toHaveBeenCalledWith(
        "SessionResumed",
        expect.any(Object)
      );
      expect(mockEventBus.subscribe).toHaveBeenCalledWith(
        "GoalCompletedEvent",
        expect.any(Object)
      );
      expect(mockEventBus.subscribe).toHaveBeenCalledWith(
        "GoalBlockedEvent",
        expect.any(Object)
      );
      expect(mockEventBus.subscribe).toHaveBeenCalledWith(
        "DecisionAdded",
        expect.any(Object)
      );
    });
  });

  describe("handleSessionStarted", () => {
    it("should archive old LATEST and create new LATEST seed", async () => {
      const sessionStartedEvent = {
        type: "SessionStarted",
        aggregateId: "session_123",
        version: 1,
        timestamp: "2025-01-01T10:00:00Z",
        payload: {
          focus: "Test session",
          contextSnapshot: null,
        },
      };

      // Get the handler that was passed to subscribe
      handler.subscribe();
      const subscribeCall = (mockEventBus.subscribe as jest.Mock).mock.calls.find(
        (call) => call[0] === "SessionStarted"
      );
      const eventHandler = subscribeCall![1] as { handle: (event: any) => Promise<void> };

      // Execute handler
      await eventHandler.handle(sessionStartedEvent);

      // Verify archival was attempted
      expect(mockStore.archiveLatest).toHaveBeenCalled();

      // Verify new LATEST seed was created
      expect(mockStore.upsertLatest).toHaveBeenCalledWith({
        sessionId: "LATEST",
        originalSessionId: "session_123",
        focus: "Test session",
        status: "active",
        contextSnapshot: null,
        completedGoals: [],
        blockersEncountered: [],
        decisions: [],
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      });
    });
  });

  describe("handleSessionEnded", () => {
    it("should mark LATEST as ended", async () => {
      const sessionEndedEvent = {
        type: "SessionEnded",
        aggregateId: "session_123",
        version: 1,
        timestamp: "2025-01-01T12:00:00Z",
        payload: {
          focus: "Test session",
          summary: "Completed work",
        },
      };

      handler.subscribe();
      const subscribeCall = (mockEventBus.subscribe as jest.Mock).mock.calls.find(
        (call) => call[0] === "SessionEnded"
      );
      const eventHandler = subscribeCall![1] as { handle: (event: any) => Promise<void> };

      await eventHandler.handle(sessionEndedEvent);

      expect(mockStore.update).toHaveBeenCalledWith("LATEST", {
        status: "ended",
        updatedAt: "2025-01-01T12:00:00Z",
      });
    });
  });

  describe("handleGoalCompleted", () => {
    it("should append enriched goal to completedGoals when LATEST is active", async () => {
      const goalCompletedEvent = {
        type: "GoalCompletedEvent",
        aggregateId: "goal_456",
        version: 1,
        timestamp: "2025-01-01T11:00:00Z",
        payload: {
          status: "completed",
        },
      };

      const mockLatest: SessionSummaryProjection = {
        sessionId: "LATEST",
        originalSessionId: "session_123",
        focus: "Test session",
        status: "active",
        contextSnapshot: null,
        completedGoals: [],
        blockersEncountered: [],
        decisions: [],
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      };

      const mockGoal: GoalView = {
        goalId: "goal_456",
        objective: "Complete task 1",
        successCriteria: [],
        scopeIn: [],
        scopeOut: [],
        boundaries: [],
        status: "completed",
        version: 1,
        createdAt: "2025-01-01T09:00:00Z",
        updatedAt: "2025-01-01T11:00:00Z",
      };

      mockStore.findLatest.mockResolvedValue(mockLatest);
      mockGoalReader.findById.mockResolvedValue(mockGoal);

      handler.subscribe();
      const subscribeCall = (mockEventBus.subscribe as jest.Mock).mock.calls.find(
        (call) => call[0] === "GoalCompletedEvent"
      );
      const eventHandler = subscribeCall![1] as { handle: (event: any) => Promise<void> };

      await eventHandler.handle(goalCompletedEvent);

      expect(mockStore.addCompletedGoal).toHaveBeenCalledWith({
        goalId: "goal_456",
        objective: "Complete task 1",
        status: "completed",
        createdAt: "2025-01-01T09:00:00Z",
      });
    });

    it("should skip when no LATEST exists", async () => {
      const goalCompletedEvent = {
        type: "GoalCompletedEvent",
        aggregateId: "goal_456",
        version: 1,
        timestamp: "2025-01-01T11:00:00Z",
        payload: {
          status: "completed",
        },
      };

      mockStore.findLatest.mockResolvedValue(null);

      handler.subscribe();
      const subscribeCall = (mockEventBus.subscribe as jest.Mock).mock.calls.find(
        (call) => call[0] === "GoalCompletedEvent"
      );
      const eventHandler = subscribeCall![1] as { handle: (event: any) => Promise<void> };

      await eventHandler.handle(goalCompletedEvent);

      expect(mockStore.addCompletedGoal).not.toHaveBeenCalled();
    });

    it("should skip when LATEST is not active", async () => {
      const goalCompletedEvent = {
        type: "GoalCompletedEvent",
        aggregateId: "goal_456",
        version: 1,
        timestamp: "2025-01-01T11:00:00Z",
        payload: {
          status: "completed",
        },
      };

      const mockLatest: SessionSummaryProjection = {
        sessionId: "LATEST",
        originalSessionId: "session_123",
        focus: "Test session",
        status: "ended",
        contextSnapshot: null,
        completedGoals: [],
        blockersEncountered: [],
        decisions: [],
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T12:00:00Z",
      };

      mockStore.findLatest.mockResolvedValue(mockLatest);

      handler.subscribe();
      const subscribeCall = (mockEventBus.subscribe as jest.Mock).mock.calls.find(
        (call) => call[0] === "GoalCompletedEvent"
      );
      const eventHandler = subscribeCall![1] as { handle: (event: any) => Promise<void> };

      await eventHandler.handle(goalCompletedEvent);

      expect(mockStore.addCompletedGoal).not.toHaveBeenCalled();
    });

    it("should skip when goal not found in projection store", async () => {
      const goalCompletedEvent = {
        type: "GoalCompletedEvent",
        aggregateId: "goal_456",
        version: 1,
        timestamp: "2025-01-01T11:00:00Z",
        payload: {
          status: "completed",
        },
      };

      const mockLatest: SessionSummaryProjection = {
        sessionId: "LATEST",
        originalSessionId: "session_123",
        focus: "Test session",
        status: "active",
        contextSnapshot: null,
        completedGoals: [],
        blockersEncountered: [],
        decisions: [],
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      };

      mockStore.findLatest.mockResolvedValue(mockLatest);
      mockGoalReader.findById.mockResolvedValue(null);

      handler.subscribe();
      const subscribeCall = (mockEventBus.subscribe as jest.Mock).mock.calls.find(
        (call) => call[0] === "GoalCompletedEvent"
      );
      const eventHandler = subscribeCall![1] as { handle: (event: any) => Promise<void> };

      await eventHandler.handle(goalCompletedEvent);

      expect(mockStore.addCompletedGoal).not.toHaveBeenCalled();
    });
  });

  describe("handleGoalBlocked", () => {
    it("should append enriched blocker when LATEST is active", async () => {
      const goalBlockedEvent = {
        type: "GoalBlockedEvent",
        aggregateId: "goal_789",
        version: 1,
        timestamp: "2025-01-01T11:30:00Z",
        payload: {
          status: "blocked",
          note: "API is down",
        },
      };

      const mockLatest: SessionSummaryProjection = {
        sessionId: "LATEST",
        originalSessionId: "session_123",
        focus: "Test session",
        status: "active",
        contextSnapshot: null,
        completedGoals: [],
        blockersEncountered: [],
        decisions: [],
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      };

      const mockGoal: GoalView = {
        goalId: "goal_789",
        objective: "Deploy to production",
        successCriteria: [],
        scopeIn: [],
        scopeOut: [],
        boundaries: [],
        status: "blocked",
        note: "API is down",
        version: 1,
        createdAt: "2025-01-01T09:00:00Z",
        updatedAt: "2025-01-01T11:30:00Z",
      };

      mockStore.findLatest.mockResolvedValue(mockLatest);
      mockGoalReader.findById.mockResolvedValue(mockGoal);

      handler.subscribe();
      const subscribeCall = (mockEventBus.subscribe as jest.Mock).mock.calls.find(
        (call) => call[0] === "GoalBlockedEvent"
      );
      const eventHandler = subscribeCall![1] as { handle: (event: any) => Promise<void> };

      await eventHandler.handle(goalBlockedEvent);

      expect(mockStore.addBlocker).toHaveBeenCalledWith({
        goalId: "goal_789",
        reason: "API is down",
      });
    });
  });

  describe("handleDecisionAdded", () => {
    it("should append enriched decision when LATEST is active", async () => {
      const decisionAddedEvent = {
        type: "DecisionAdded",
        aggregateId: "dec_001",
        version: 1,
        timestamp: "2025-01-01T11:45:00Z",
        payload: {
          title: "Use TypeScript",
          context: "Language choice",
          rationale: "Type safety and better tooling",
          alternatives: ["JavaScript", "Flow"],
          consequences: "Learning curve for team",
          status: "active",
        },
      };

      const mockLatest: SessionSummaryProjection = {
        sessionId: "LATEST",
        originalSessionId: "session_123",
        focus: "Test session",
        status: "active",
        contextSnapshot: null,
        completedGoals: [],
        blockersEncountered: [],
        decisions: [],
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      };

      const mockDecision: DecisionView = {
        decisionId: "dec_001",
        title: "Use TypeScript",
        context: "Language choice",
        rationale: "Type safety and better tooling",
        alternatives: ["JavaScript", "Flow"],
        consequences: "Learning curve for team",
        status: "active",
        supersededBy: null,
        reversalReason: null,
        reversedAt: null,
        version: 1,
        createdAt: "2025-01-01T11:45:00Z",
        updatedAt: "2025-01-01T11:45:00Z",
      };

      mockStore.findLatest.mockResolvedValue(mockLatest);
      mockDecisionReader.findById.mockResolvedValue(mockDecision);

      handler.subscribe();
      const subscribeCall = (mockEventBus.subscribe as jest.Mock).mock.calls.find(
        (call) => call[0] === "DecisionAdded"
      );
      const eventHandler = subscribeCall![1] as { handle: (event: any) => Promise<void> };

      await eventHandler.handle(decisionAddedEvent);

      expect(mockStore.addDecision).toHaveBeenCalledWith({
        decisionId: "dec_001",
        title: "Use TypeScript",
        rationale: "Type safety and better tooling",
      });
    });
  });
});
