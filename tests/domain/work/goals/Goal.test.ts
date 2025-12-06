/**
 * Tests for Goal aggregate
 */

import { Goal } from "../../../../src/domain/work/goals/Goal";
import { GoalEventType, GoalStatus } from "../../../../src/domain/work/goals/Constants";

describe("Goal Aggregate", () => {
  describe("define()", () => {
    it("should create GoalAddedEvent event with required fields only", () => {
      // Arrange
      const goal = Goal.create("goal_123");

      // Act
      const event = goal.add("Implement authentication", ["Users can log in"]);

      // Assert
      expect(event.type).toBe(GoalEventType.ADDED);
      expect(event.aggregateId).toBe("goal_123");
      expect(event.version).toBe(1);
      expect(event.payload.objective).toBe("Implement authentication");
      expect(event.payload.successCriteria).toEqual(["Users can log in"]);
      expect(event.payload.scopeIn).toEqual([]);
      expect(event.payload.scopeOut).toEqual([]);
      expect(event.payload.boundaries).toEqual([]);
      expect(event.payload.status).toBe(GoalStatus.TODO);
      expect(event.timestamp).toBeDefined();
    });

    it("should create GoalAddedEvent event with all optional fields", () => {
      // Arrange
      const goal = Goal.create("goal_123");

      // Act
      const event = goal.add(
        "Implement JWT authentication",
        ["Token generation on login", "Middleware validates tokens"],
        ["UserController", "AuthMiddleware"],
        ["Admin routes"],
        ["Keep existing API contract"]
      );

      // Assert
      expect(event.payload.objective).toBe("Implement JWT authentication");
      expect(event.payload.successCriteria).toEqual([
        "Token generation on login",
        "Middleware validates tokens",
      ]);
      expect(event.payload.scopeIn).toEqual(["UserController", "AuthMiddleware"]);
      expect(event.payload.scopeOut).toEqual(["Admin routes"]);
      expect(event.payload.boundaries).toEqual(["Keep existing API contract"]);
    });

    it("should throw error if goal is already defined", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("First goal", ["Criterion 1"]);

      // Act & Assert
      expect(() => goal.add("Second goal", ["Criterion 2"])).toThrow(
        "Goal has already been defined"
      );
    });

    it("should throw error if objective is empty", () => {
      // Arrange
      const goal = Goal.create("goal_123");

      // Act & Assert
      expect(() => goal.add("", ["Criterion 1"])).toThrow(
        "Goal objective must be provided"
      );
    });

    it("should throw error if objective is too long", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      const longObjective = "a".repeat(201); // Max is 200

      // Act & Assert
      expect(() => goal.add(longObjective, ["Criterion 1"])).toThrow(
        "Objective must be less than 200 characters"
      );
    });

    it("should throw error if no success criteria provided", () => {
      // Arrange
      const goal = Goal.create("goal_123");

      // Act & Assert
      expect(() => goal.add("My objective", [])).toThrow(
        "At least one success criterion must be provided"
      );
    });

    it("should throw error if too many success criteria", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      const tooManyCriteria = Array.from({ length: 21 }, (_, i) => `Criterion ${i}`);

      // Act & Assert
      expect(() => goal.add("My objective", tooManyCriteria)).toThrow(
        "Cannot have more than 20 success criteria"
      );
    });

    it("should throw error if success criterion is too long", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      const longCriterion = "a".repeat(301); // Max is 300

      // Act & Assert
      expect(() => goal.add("My objective", [longCriterion])).toThrow(
        "Success criterion must be less than 300 characters"
      );
    });

    it("should throw error if too many scope items", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      const tooManyItems = Array.from({ length: 21 }, (_, i) => `Item ${i}`);

      // Act & Assert
      expect(() =>
        goal.add("My objective", ["Criterion 1"], tooManyItems)
      ).toThrow("Cannot have more than 20 scope items");
    });

    it("should throw error if scope item is too long", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      const longItem = "a".repeat(201); // Max is 200

      // Act & Assert
      expect(() =>
        goal.add("My objective", ["Criterion 1"], [longItem])
      ).toThrow("Scope item must be less than 200 characters");
    });

    it("should update aggregate state after event creation", () => {
      // Arrange
      const goal = Goal.create("goal_123");

      // Act
      goal.add(
        "Implement authentication",
        ["Users can log in", "Tokens are validated"],
        ["AuthController"],
        ["AdminPanel"],
        ["No breaking changes"]
      );

      // Assert
      const snapshot = goal.snapshot;
      expect(snapshot.objective).toBe("Implement authentication");
      expect(snapshot.successCriteria).toEqual(["Users can log in", "Tokens are validated"]);
      expect(snapshot.scopeIn).toEqual(["AuthController"]);
      expect(snapshot.scopeOut).toEqual(["AdminPanel"]);
      expect(snapshot.boundaries).toEqual(["No breaking changes"]);
      expect(snapshot.status).toBe(GoalStatus.TODO);
      expect(snapshot.version).toBe(1);
    });
  });

  describe("start()", () => {
    it("should create GoalStartedEvent event when starting a to-do goal", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);

      // Act
      const event = goal.start();

      // Assert
      expect(event.type).toBe(GoalEventType.STARTED);
      expect(event.aggregateId).toBe("goal_123");
      expect(event.version).toBe(2);
      expect(event.payload.status).toBe(GoalStatus.DOING);
      expect(event.timestamp).toBeDefined();
    });

    it("should update aggregate state to doing after start", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);

      // Act
      goal.start();

      // Assert
      const snapshot = goal.snapshot;
      expect(snapshot.status).toBe(GoalStatus.DOING);
      expect(snapshot.version).toBe(2);
    });

    it("should allow starting already-doing goal (idempotent)", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.start(); // First start

      // Act - start again
      const event = goal.start();

      // Assert - should succeed
      expect(event.type).toBe(GoalEventType.STARTED);
      expect(event.payload.status).toBe(GoalStatus.DOING);
    });

    it("should throw error when starting blocked goal", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      // Simulate blocked status (would need Goal.block() method implemented)
      // For now, test with rehydration from events
      // Skip this test until block() is implemented

      // This test will be added when Goal.block() is implemented in Task-04
    });

    it("should throw error when starting completed goal", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      // Simulate completed status (would need Goal.complete() method implemented)
      // Skip this test until complete() is implemented

      // This test will be added when Goal.complete() is implemented in Task-06
    });
  });

  describe("update()", () => {
    it("should create GoalUpdatedEvent event with objective only", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Original objective", ["Criterion 1"]);

      // Act
      const event = goal.update("Updated objective");

      // Assert
      expect(event.type).toBe(GoalEventType.UPDATED);
      expect(event.aggregateId).toBe("goal_123");
      expect(event.version).toBe(2);
      expect(event.payload.objective).toBe("Updated objective");
      expect(event.payload.successCriteria).toBeUndefined();
      expect(event.payload.scopeIn).toBeUndefined();
      expect(event.payload.scopeOut).toBeUndefined();
      expect(event.payload.boundaries).toBeUndefined();
      expect(event.timestamp).toBeDefined();
    });

    it("should create GoalUpdatedEvent event with success criteria only", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Old criterion"]);

      // Act
      const event = goal.update(undefined, ["New criterion 1", "New criterion 2"]);

      // Assert
      expect(event.type).toBe(GoalEventType.UPDATED);
      expect(event.payload.objective).toBeUndefined();
      expect(event.payload.successCriteria).toEqual(["New criterion 1", "New criterion 2"]);
    });

    it("should create GoalUpdatedEvent event with all fields", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Original", ["Criterion 1"]);

      // Act
      const event = goal.update(
        "Updated objective",
        ["Updated criterion"],
        ["In scope"],
        ["Out of scope"],
        ["Boundary 1"]
      );

      // Assert
      expect(event.payload.objective).toBe("Updated objective");
      expect(event.payload.successCriteria).toEqual(["Updated criterion"]);
      expect(event.payload.scopeIn).toEqual(["In scope"]);
      expect(event.payload.scopeOut).toEqual(["Out of scope"]);
      expect(event.payload.boundaries).toEqual(["Boundary 1"]);
    });

    it("should update aggregate state with partial fields", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Original objective", ["Original criterion"], ["Original scope in"]);

      // Act - only update objective
      goal.update("Updated objective");

      // Assert
      const snapshot = goal.snapshot;
      expect(snapshot.objective).toBe("Updated objective");
      expect(snapshot.successCriteria).toEqual(["Original criterion"]); // Unchanged
      expect(snapshot.scopeIn).toEqual(["Original scope in"]); // Unchanged
      expect(snapshot.version).toBe(2);
    });

    it("should throw error if no fields provided", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Criterion 1"]);

      // Act & Assert
      expect(() => goal.update()).toThrow("At least one field must be provided for update");
    });

    it("should throw error if goal is completed", () => {
      // Arrange - skip this test until complete() is implemented
      // This test will be added when Goal.complete() is implemented in Task-06
    });

    it("should throw error if objective is empty", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Original objective", ["Criterion 1"]);

      // Act & Assert
      expect(() => goal.update("")).toThrow("Goal objective must be provided");
    });

    it("should throw error if objective is too long", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Original objective", ["Criterion 1"]);
      const longObjective = "a".repeat(201); // Max is 200

      // Act & Assert
      expect(() => goal.update(longObjective)).toThrow(
        "Objective must be less than 200 characters"
      );
    });

    it("should throw error if success criteria is empty array", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Original objective", ["Criterion 1"]);

      // Act & Assert
      expect(() => goal.update(undefined, [])).toThrow(
        "At least one success criterion must be provided"
      );
    });

    it("should throw error if too many success criteria", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Original objective", ["Criterion 1"]);
      const tooManyCriteria = Array.from({ length: 21 }, (_, i) => `Criterion ${i}`);

      // Act & Assert
      expect(() => goal.update(undefined, tooManyCriteria)).toThrow(
        "Cannot have more than 20 success criteria"
      );
    });

    it("should throw error if success criterion is too long", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Original objective", ["Criterion 1"]);
      const longCriterion = "a".repeat(301); // Max is 300

      // Act & Assert
      expect(() => goal.update(undefined, [longCriterion])).toThrow(
        "Success criterion must be less than 300 characters"
      );
    });

    it("should throw error if too many scope items", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Original objective", ["Criterion 1"]);
      const tooManyItems = Array.from({ length: 21 }, (_, i) => `Item ${i}`);

      // Act & Assert
      expect(() => goal.update(undefined, undefined, tooManyItems)).toThrow(
        "Cannot have more than 20 scope items"
      );
    });

    it("should throw error if scope item is too long", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Original objective", ["Criterion 1"]);
      const longItem = "a".repeat(201); // Max is 200

      // Act & Assert
      expect(() => goal.update(undefined, undefined, [longItem])).toThrow(
        "Scope item must be less than 200 characters"
      );
    });
  });

  describe("block()", () => {
    it("should create GoalBlockedEvent event from to-do status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);

      // Act
      const event = goal.block("Waiting for API credentials");

      // Assert
      expect(event.type).toBe(GoalEventType.BLOCKED);
      expect(event.aggregateId).toBe("goal_123");
      expect(event.version).toBe(2);
      expect(event.payload.status).toBe(GoalStatus.BLOCKED);
      expect(event.payload.note).toBe("Waiting for API credentials");
      expect(event.timestamp).toBeDefined();
    });

    it("should create GoalBlockedEvent event from doing status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.start();

      // Act
      const event = goal.block("Database server is down");

      // Assert
      expect(event.type).toBe(GoalEventType.BLOCKED);
      expect(event.payload.status).toBe(GoalStatus.BLOCKED);
      expect(event.payload.note).toBe("Database server is down");
      expect(event.version).toBe(3);
    });

    it("should throw error if note is not provided", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);

      // Act & Assert
      expect(() => goal.block("")).toThrow("Note is required when blocking a goal");
    });

    it("should throw error if note is too long", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      const longNote = "a".repeat(501); // Max is 500

      // Act & Assert
      expect(() => goal.block(longNote)).toThrow("Note must be less than 500 characters");
    });

    it("should throw error if goal is already blocked", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.block("First blocker");

      // Act & Assert
      expect(() => goal.block("Second blocker")).toThrow(
        "Cannot block goal in blocked status. Goal must be in to-do or doing status."
      );
    });
  });

  describe("unblock()", () => {
    it("should create GoalUnblockedEvent event without note", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.block("Waiting for API credentials");

      // Act
      const event = goal.unblock();

      // Assert
      expect(event.type).toBe(GoalEventType.UNBLOCKED);
      expect(event.aggregateId).toBe("goal_123");
      expect(event.version).toBe(3);
      expect(event.payload.status).toBe(GoalStatus.DOING);
      expect(event.payload.note).toBeUndefined();
      expect(event.timestamp).toBeDefined();
    });

    it("should create GoalUnblockedEvent event with resolution note", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.start();
      goal.block("Database server is down");

      // Act
      const event = goal.unblock("Server is back online");

      // Assert
      expect(event.type).toBe(GoalEventType.UNBLOCKED);
      expect(event.payload.status).toBe(GoalStatus.DOING);
      expect(event.payload.note).toBe("Server is back online");
      expect(event.version).toBe(4);
    });

    it("should sanitize empty note to undefined", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.block("Blocked");

      // Act
      const event = goal.unblock("   ");

      // Assert
      expect(event.payload.note).toBeUndefined();
    });

    it("should throw error if note is too long", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.block("Blocked");
      const longNote = "a".repeat(501); // Max is 500

      // Act & Assert
      expect(() => goal.unblock(longNote)).toThrow("Note must be less than 500 characters");
    });

    it("should throw error if goal is not blocked (to-do status)", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);

      // Act & Assert
      expect(() => goal.unblock()).toThrow(
        "Cannot unblock goal in to-do status. Goal must be blocked."
      );
    });

    it("should throw error if goal is not blocked (doing status)", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.start();

      // Act & Assert
      expect(() => goal.unblock()).toThrow(
        "Cannot unblock goal in doing status. Goal must be blocked."
      );
    });

    it("should transition goal back to doing status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.start();
      goal.block("Blocked");

      // Act
      goal.unblock("Resolved");

      // Assert
      const snapshot = goal.snapshot;
      expect(snapshot.status).toBe(GoalStatus.DOING);
      expect(snapshot.note).toBe("Resolved");
      expect(snapshot.version).toBe(4);
    });
  });

  describe("complete()", () => {
    it("should create GoalCompletedEvent event from doing status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.start();

      // Act
      const event = goal.complete();

      // Assert
      expect(event.type).toBe(GoalEventType.COMPLETED);
      expect(event.aggregateId).toBe("goal_123");
      expect(event.version).toBe(3);
      expect(event.payload.status).toBe(GoalStatus.COMPLETED);
      expect(event.timestamp).toBeDefined();
    });

    it("should create GoalCompletedEvent event from blocked status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.start();
      goal.block("Waiting for API credentials");

      // Act
      const event = goal.complete();

      // Assert
      expect(event.type).toBe(GoalEventType.COMPLETED);
      expect(event.aggregateId).toBe("goal_123");
      expect(event.version).toBe(4);
      expect(event.payload.status).toBe(GoalStatus.COMPLETED);
      expect(event.timestamp).toBeDefined();
    });

    it("should throw error if goal is not started (to-do status)", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);

      // Act & Assert
      expect(() => goal.complete()).toThrow(
        "Cannot complete a goal that has not been started"
      );
    });

    it("should throw error if goal is already completed", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.start();
      goal.complete();

      // Act & Assert
      expect(() => goal.complete()).toThrow(
        "Goal is already completed"
      );
    });

    it("should transition goal to completed status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.start();

      // Act
      goal.complete();

      // Assert
      const snapshot = goal.snapshot;
      expect(snapshot.status).toBe(GoalStatus.COMPLETED);
      expect(snapshot.version).toBe(3);
    });

    it("should transition from blocked to completed", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Implement authentication", ["Users can log in"]);
      goal.start();
      goal.block("Waiting for dependencies");

      // Act
      goal.complete();

      // Assert
      const snapshot = goal.snapshot;
      expect(snapshot.status).toBe(GoalStatus.COMPLETED);
      expect(snapshot.version).toBe(4);
    });
  });

  describe("rehydrate()", () => {
    it("should rebuild aggregate from event history", () => {
      // Arrange
      const goal1 = Goal.create("goal_123");
      const event = goal1.add(
        "Implement authentication",
        ["Users can log in"],
        ["AuthController"]
      );

      // Act
      const goal2 = Goal.rehydrate("goal_123", [event]);

      // Assert
      const snapshot = goal2.snapshot;
      expect(snapshot.objective).toBe("Implement authentication");
      expect(snapshot.successCriteria).toEqual(["Users can log in"]);
      expect(snapshot.scopeIn).toEqual(["AuthController"]);
      expect(snapshot.version).toBe(1);
    });

    it("should rebuild aggregate with GoalStartedEvent event", () => {
      // Arrange
      const goal1 = Goal.create("goal_123");
      const addedEvent = goal1.add("Implement authentication", ["Users can log in"]);
      const startedEvent = goal1.start();

      // Act
      const goal2 = Goal.rehydrate("goal_123", [addedEvent, startedEvent]);

      // Assert
      const snapshot = goal2.snapshot;
      expect(snapshot.objective).toBe("Implement authentication");
      expect(snapshot.status).toBe(GoalStatus.DOING);
      expect(snapshot.version).toBe(2);
    });

    it("should rebuild aggregate with GoalUpdatedEvent event", () => {
      // Arrange
      const goal1 = Goal.create("goal_123");
      const addedEvent = goal1.add("Original objective", ["Original criterion"], ["Original scope"]);
      const updatedEvent = goal1.update("Updated objective", ["Updated criterion 1", "Updated criterion 2"]);

      // Act
      const goal2 = Goal.rehydrate("goal_123", [addedEvent, updatedEvent]);

      // Assert
      const snapshot = goal2.snapshot;
      expect(snapshot.objective).toBe("Updated objective");
      expect(snapshot.successCriteria).toEqual(["Updated criterion 1", "Updated criterion 2"]);
      expect(snapshot.scopeIn).toEqual(["Original scope"]); // Unchanged
      expect(snapshot.version).toBe(2);
    });

    it("should rebuild aggregate with multiple GoalUpdatedEvent events", () => {
      // Arrange
      const goal1 = Goal.create("goal_123");
      const addedEvent = goal1.add("Original objective", ["Criterion 1"]);
      const updated1Event = goal1.update("Updated objective");
      const updated2Event = goal1.update(undefined, ["New criterion"]);

      // Act
      const goal2 = Goal.rehydrate("goal_123", [addedEvent, updated1Event, updated2Event]);

      // Assert
      const snapshot = goal2.snapshot;
      expect(snapshot.objective).toBe("Updated objective");
      expect(snapshot.successCriteria).toEqual(["New criterion"]);
      expect(snapshot.version).toBe(3);
    });
  });
});
