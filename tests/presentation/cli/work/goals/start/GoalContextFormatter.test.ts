/**
 * Tests for GoalContextFormatter
 *
 * Verifies YAML output structure for goal context including:
 * - Embedded context fields (architecture, filesToCreate, filesToChange)
 * - Backward compatibility with legacy goals (no embedded context)
 * - Token-optimized output (only includes sections when data exists)
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { GoalContextFormatter } from "../../../../../../src/presentation/cli/work/goals/start/GoalContextFormatter.js";
import { GoalContextView } from "../../../../../../src/application/work/goals/get-context/GoalContextView.js";
import { GoalView } from "../../../../../../src/application/work/goals/GoalView.js";

describe("GoalContextFormatter", () => {
  let formatter: GoalContextFormatter;

  beforeEach(() => {
    formatter = new GoalContextFormatter();
  });

  /**
   * Creates a minimal goal view for testing
   */
  function createGoalView(overrides: Partial<GoalView> = {}): GoalView {
    return {
      goalId: "goal_test123",
      objective: "Test objective",
      successCriteria: ["Criterion 1", "Criterion 2"],
      scopeIn: ["src/test.ts"],
      scopeOut: [],
      boundaries: ["Stay within scope"],
      status: "doing",
      version: 1,
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z",
      progress: [],
      ...overrides,
    };
  }

  /**
   * Creates a minimal goal context view for testing
   */
  function createGoalContextView(
    goalOverrides: Partial<GoalView> = {},
    contextOverrides: Partial<Omit<GoalContextView, "goal">> = {}
  ): GoalContextView {
    return {
      goal: createGoalView(goalOverrides),
      components: [],
      dependencies: [],
      decisions: [],
      invariants: [],
      guidelines: [],
      relations: [],
      ...contextOverrides,
    };
  }

  describe("basic goal formatting", () => {
    it("should format goal with required fields", () => {
      const context = createGoalContextView();
      const result = formatter.format(context);

      expect(result).toContain("goalId: goal_test123");
      expect(result).toContain("objective: Test objective");
      expect(result).toContain("status: doing");
      expect(result).toContain("criteria:");
      expect(result).toContain("- Criterion 1");
    });

    it("should include scope section", () => {
      const context = createGoalContextView();
      const result = formatter.format(context);

      expect(result).toContain("scope:");
      expect(result).toContain("in:");
      expect(result).toContain("- src/test.ts");
    });

    it("should include boundaries", () => {
      const context = createGoalContextView();
      const result = formatter.format(context);

      expect(result).toContain("boundaries:");
      expect(result).toContain("- Stay within scope");
    });
  });

  describe("embedded context - architecture", () => {
    it("should include architecture section when present", () => {
      const context = createGoalContextView({
        architecture: {
          description: "Layered architecture with CQRS",
          organization: "Domain-driven design",
          patterns: ["Event Sourcing", "CQRS"],
          principles: ["Single Responsibility", "Dependency Inversion"],
        },
      });

      const result = formatter.format(context);

      expect(result).toContain("architecture:");
      expect(result).toContain("description: Layered architecture with CQRS");
      expect(result).toContain("organization: Domain-driven design");
      expect(result).toContain("patterns:");
      expect(result).toContain("- Event Sourcing");
      expect(result).toContain("principles:");
      expect(result).toContain("- Single Responsibility");
    });

    it("should omit architecture section when not present", () => {
      const context = createGoalContextView();
      const result = formatter.format(context);

      expect(result).not.toContain("architecture:");
    });

    it("should handle architecture without optional patterns/principles", () => {
      const context = createGoalContextView({
        architecture: {
          description: "Simple architecture",
          organization: "Monolith",
        },
      });

      const result = formatter.format(context);

      expect(result).toContain("architecture:");
      expect(result).toContain("description: Simple architecture");
      expect(result).toContain("organization: Monolith");
      expect(result).not.toContain("patterns:");
      expect(result).not.toContain("principles:");
    });
  });

  describe("embedded context - files to create/change", () => {
    it("should include filesToCreate when present", () => {
      const context = createGoalContextView({
        filesToBeCreated: [
          "src/new/NewService.ts",
          "src/new/NewService.test.ts",
        ],
      });

      const result = formatter.format(context);

      expect(result).toContain("filesToCreate:");
      expect(result).toContain("- src/new/NewService.ts");
      expect(result).toContain("- src/new/NewService.test.ts");
    });

    it("should include filesToChange when present", () => {
      const context = createGoalContextView({
        filesToBeChanged: [
          "src/existing/Service.ts",
          "src/existing/Handler.ts",
        ],
      });

      const result = formatter.format(context);

      expect(result).toContain("filesToChange:");
      expect(result).toContain("- src/existing/Service.ts");
      expect(result).toContain("- src/existing/Handler.ts");
    });

    it("should include both filesToCreate and filesToChange when present", () => {
      const context = createGoalContextView({
        filesToBeCreated: ["src/new/Feature.ts"],
        filesToBeChanged: ["src/existing/Config.ts"],
      });

      const result = formatter.format(context);

      expect(result).toContain("filesToCreate:");
      expect(result).toContain("- src/new/Feature.ts");
      expect(result).toContain("filesToChange:");
      expect(result).toContain("- src/existing/Config.ts");
    });

    it("should omit filesToCreate when empty array", () => {
      const context = createGoalContextView({
        filesToBeCreated: [],
      });

      const result = formatter.format(context);

      expect(result).not.toContain("filesToCreate:");
    });

    it("should omit filesToChange when undefined", () => {
      const context = createGoalContextView();
      const result = formatter.format(context);

      expect(result).not.toContain("filesToChange:");
    });
  });

  describe("backward compatibility - legacy goals", () => {
    it("should format legacy goal without embedded context fields", () => {
      // Legacy goal - no embedded context fields
      const context = createGoalContextView();
      const result = formatter.format(context);

      // Should still include basic goal info
      expect(result).toContain("goalContext:");
      expect(result).toContain("goal:");
      expect(result).toContain("goalId:");
      expect(result).toContain("objective:");

      // Should not include embedded context sections
      expect(result).not.toContain("architecture:");
      expect(result).not.toContain("filesToCreate:");
      expect(result).not.toContain("filesToChange:");
    });

    it("should format legacy goal with solution context from projectors", () => {
      const context = createGoalContextView(
        {},
        {
          components: [
            {
              componentId: "comp_1",
              name: "TestComponent",
              description: "A test component",
              status: "active",
            },
          ],
          decisions: [
            {
              decisionId: "dec_1",
              title: "Use TypeScript",
              rationale: "Type safety",
              status: "active",
            },
          ],
        }
      );

      const result = formatter.format(context);

      expect(result).toContain("solution:");
      expect(result).toContain("components:");
      expect(result).toContain("name: TestComponent");
      expect(result).toContain("decisions:");
      expect(result).toContain("title: Use TypeScript");
    });
  });

  describe("optional sections", () => {
    it("should include invariants when present", () => {
      const context = createGoalContextView(
        {},
        {
          invariants: [
            {
              invariantId: "inv_1",
              category: "Single Responsibility",
              description: "One class, one reason to change",
            },
          ],
        }
      );

      const result = formatter.format(context);

      expect(result).toContain("invariants:");
      expect(result).toContain("title: Single Responsibility");
    });

    it("should include guidelines when present", () => {
      const context = createGoalContextView(
        {},
        {
          guidelines: [
            {
              guidelineId: "guide_1",
              category: "codingStyle",
              description: "Use descriptive names",
            },
          ],
        }
      );

      const result = formatter.format(context);

      expect(result).toContain("guidelines:");
      expect(result).toContain("category: codingStyle");
    });

    it("should include relations when present", () => {
      const context = createGoalContextView(
        {},
        {
          relations: [
            {
              fromEntityId: "comp_1",
              toEntityId: "comp_2",
              relationType: "depends-on",
              description: "Uses API",
            },
          ],
        }
      );

      const result = formatter.format(context);

      expect(result).toContain("relations:");
      expect(result).toContain("from: comp_1");
      expect(result).toContain("to: comp_2");
      expect(result).toContain("type: depends-on");
    });

    it("should omit empty sections for token optimization", () => {
      const context = createGoalContextView();
      const result = formatter.format(context);

      // No data in these sections, so they should be omitted
      expect(result).not.toContain("solution:");
      expect(result).not.toContain("invariants:");
      expect(result).not.toContain("guidelines:");
      expect(result).not.toContain("relations:");
    });
  });
});
