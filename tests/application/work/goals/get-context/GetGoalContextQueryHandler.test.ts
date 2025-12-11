import { describe, it, expect, beforeEach } from "@jest/globals";
import { GetGoalContextQueryHandler } from "../../../../../src/application/work/goals/get-context/GetGoalContextQueryHandler.js";
import { IGoalContextReader } from "../../../../../src/application/work/goals/get-context/IGoalContextReader.js";
import { GoalView } from "../../../../../src/application/work/goals/GoalView.js";

/**
 * Tests for GetGoalContextQueryHandler
 */

// Mock implementation of IGoalContextReader
class MockGoalContextReader implements IGoalContextReader {
  private goals: Map<string, GoalView> = new Map();

  async findById(goalId: string): Promise<GoalView | null> {
    return this.goals.get(goalId) || null;
  }

  // Test helper methods
  addGoal(goal: GoalView): void {
    this.goals.set(goal.goalId, goal);
  }

  clear(): void {
    this.goals.clear();
  }
}

describe("GetGoalContextQueryHandler", () => {
  let mockReader: MockGoalContextReader;
  let query: GetGoalContextQueryHandler;

  beforeEach(() => {
    mockReader = new MockGoalContextReader();
    query = new GetGoalContextQueryHandler(mockReader);
  });

  describe("execute", () => {
    it("should return goal context with goal details", async () => {
      // Arrange
      const goal: GoalView = {
        goalId: "goal_123",
        objective: "Implement JWT authentication",
        successCriteria: ["Token generation", "Middleware validates tokens"],
        scopeIn: ["UserController", "AuthMiddleware"],
        scopeOut: ["AdminRoutes"],
        boundaries: ["Keep API contract", "No DB schema changes"],
        status: "doing",
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      mockReader.addGoal(goal);

      // Act
      const context = await query.execute("goal_123");

      // Assert
      expect(context.goal).toEqual(goal);
      expect(context.goal.objective).toBe("Implement JWT authentication");
      expect(context.goal.successCriteria).toHaveLength(2);
      expect(context.goal.scopeIn).toEqual(["UserController", "AuthMiddleware"]);
      expect(context.goal.boundaries).toHaveLength(2);
    });

    it("should return empty arrays for Phase 1 implementation", async () => {
      // Arrange
      const goal: GoalView = {
        goalId: "goal_456",
        objective: "Test goal",
        successCriteria: ["Criteria 1"],
        scopeIn: ["Component1"],
        scopeOut: [],
        boundaries: [],
        status: "to-do",
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      mockReader.addGoal(goal);

      // Act
      const context = await query.execute("goal_456");

      // Assert - Phase 1 returns empty arrays for other categories
      expect(context.components).toEqual([]);
      expect(context.dependencies).toEqual([]);
      expect(context.decisions).toEqual([]);
      expect(context.invariants).toEqual([]);
      expect(context.guidelines).toEqual([]);
      expect(context.relations).toEqual([]);
    });

    it("should throw error when goal not found", async () => {
      // Act & Assert
      await expect(query.execute("nonexistent_goal")).rejects.toThrow(
        "Goal not found: nonexistent_goal"
      );
    });

    it("should handle goal with note field", async () => {
      // Arrange
      const goal: GoalView = {
        goalId: "goal_789",
        objective: "Blocked goal",
        successCriteria: ["Do something"],
        scopeIn: [],
        scopeOut: [],
        boundaries: [],
        status: "blocked",
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        note: "Waiting for external API documentation",
      };

      mockReader.addGoal(goal);

      // Act
      const context = await query.execute("goal_789");

      // Assert
      expect(context.goal.note).toBe("Waiting for external API documentation");
      expect(context.goal.status).toBe("blocked");
    });
  });
});
