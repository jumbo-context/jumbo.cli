/**
 * Tests for Goal.apply() and Goal.rehydrate() static methods
 * (formerly GoalProjection)
 */

import { Goal, GoalState } from "../../../../src/domain/work/goals/Goal";
import { GoalAddedEvent, GoalStartedEvent, GoalCompletedEvent } from "../../../../src/domain/work/goals/EventIndex";
import { GoalEventType, GoalStatus } from "../../../../src/domain/work/goals/Constants";

describe("Goal", () => {
  describe("apply()", () => {
    it("should apply GoalAddedEvent event correctly", () => {
      // Arrange
      const state = {
        id: "goal_123",
        objective: "",
        successCriteria: [],
        scopeIn: [],
        scopeOut: [],
        boundaries: [],
        status: 'to-do' as const,
        version: 0,
      };

      const event: GoalAddedEvent = {
        type: GoalEventType.ADDED,
        aggregateId: "goal_123",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          objective: "Implement authentication",
          successCriteria: ["Users can log in"],
          scopeIn: ["AuthController"],
          scopeOut: ["AdminPanel"],
          boundaries: ["No breaking changes"],
          status: GoalStatus.TODO,
        },
      };

      // Act
      Goal.apply(state, event);

      // Assert
      expect(state.objective).toBe("Implement authentication");
      expect(state.successCriteria).toEqual(["Users can log in"]);
      expect(state.scopeIn).toEqual(["AuthController"]);
      expect(state.scopeOut).toEqual(["AdminPanel"]);
      expect(state.boundaries).toEqual(["No breaking changes"]);
      expect(state.status).toBe(GoalStatus.TODO);
      expect(state.version).toBe(1);
    });

    it("should apply GoalStartedEvent event correctly", () => {
      // Arrange
      const state = {
        id: "goal_123",
        objective: "Implement authentication",
        successCriteria: ["Users can log in"],
        scopeIn: ["AuthController"],
        scopeOut: [],
        boundaries: [],
        status: GoalStatus.TODO,
        version: 1,
      };

      const event: GoalStartedEvent = {
        type: GoalEventType.STARTED,
        aggregateId: "goal_123",
        version: 2,
        timestamp: new Date().toISOString(),
        payload: {
          status: GoalStatus.DOING,
        },
      };

      // Act
      Goal.apply(state, event);

      // Assert
      expect(state.status).toBe(GoalStatus.DOING);
      expect(state.version).toBe(2);
      // Other fields should remain unchanged
      expect(state.objective).toBe("Implement authentication");
      expect(state.successCriteria).toEqual(["Users can log in"]);
    });

    it("should apply GoalCompletedEvent event correctly", () => {
      // Arrange
      const state = {
        id: "goal_123",
        objective: "Implement authentication",
        successCriteria: ["Users can log in"],
        scopeIn: ["AuthController"],
        scopeOut: [],
        boundaries: [],
        status: GoalStatus.DOING,
        version: 2,
      };

      const event: GoalCompletedEvent = {
        type: GoalEventType.COMPLETED,
        aggregateId: "goal_123",
        version: 3,
        timestamp: new Date().toISOString(),
        payload: {
          status: GoalStatus.COMPLETED,
        },
      };

      // Act
      Goal.apply(state, event);

      // Assert
      expect(state.status).toBe(GoalStatus.COMPLETED);
      expect(state.version).toBe(3);
      // Other fields should remain unchanged
      expect(state.objective).toBe("Implement authentication");
      expect(state.successCriteria).toEqual(["Users can log in"]);
    });
  });

  describe("rehydrate()", () => {
    it("should rehydrate from empty history", () => {
      // Act
      const goal = Goal.rehydrate("goal_123", []);
      const state = goal.snapshot;

      // Assert
      expect(state.id).toBe("goal_123");
      expect(state.objective).toBe("");
      expect(state.successCriteria).toEqual([]);
      expect(state.version).toBe(0);
    });

    it("should rehydrate from single event", () => {
      // Arrange
      const event: GoalAddedEvent = {
        type: GoalEventType.ADDED,
        aggregateId: "goal_123",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          objective: "Implement authentication",
          successCriteria: ["Users can log in", "Tokens are validated"],
          scopeIn: ["AuthController"],
          scopeOut: [],
          boundaries: [],
          status: GoalStatus.TODO,
        },
      };

      // Act
      const goal = Goal.rehydrate("goal_123", [event]);
      const state = goal.snapshot;

      // Assert
      expect(state.objective).toBe("Implement authentication");
      expect(state.successCriteria).toEqual(["Users can log in", "Tokens are validated"]);
      expect(state.scopeIn).toEqual(["AuthController"]);
      expect(state.version).toBe(1);
    });

    it("should rehydrate from multiple events (GoalAddedEvent + GoalStartedEvent)", () => {
      // Arrange
      const addedEvent: GoalAddedEvent = {
        type: GoalEventType.ADDED,
        aggregateId: "goal_123",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          objective: "Implement authentication",
          successCriteria: ["Users can log in"],
          scopeIn: ["AuthController"],
          scopeOut: [],
          boundaries: [],
          status: GoalStatus.TODO,
        },
      };

      const startedEvent: GoalStartedEvent = {
        type: GoalEventType.STARTED,
        aggregateId: "goal_123",
        version: 2,
        timestamp: new Date().toISOString(),
        payload: {
          status: GoalStatus.DOING,
        },
      };

      // Act
      const goal = Goal.rehydrate("goal_123", [addedEvent, startedEvent]);
      const state = goal.snapshot;

      // Assert
      expect(state.objective).toBe("Implement authentication");
      expect(state.status).toBe(GoalStatus.DOING);
      expect(state.version).toBe(2);
    });
  });
});
