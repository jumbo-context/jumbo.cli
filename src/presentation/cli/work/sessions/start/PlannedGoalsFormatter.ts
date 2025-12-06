import { GoalView } from "../../../../../application/work/goals/GoalView.js";
import { YamlFormatter } from "../../../shared/formatting/YamlFormatter.js";

/**
 * PlannedGoalsFormatter - Formats planned goals for LLM orientation context
 *
 * Renders the current state: what goals are available to work on next.
 * Only shows goals with status='planned' (not in-progress, completed, or blocked).
 *
 * Output Format: YAML (more LLM-friendly than JSON)
 *
 * Usage:
 *   const formatter = new PlannedGoalsFormatter();
 *   const contextMarkdown = formatter.format(plannedGoals);
 */
export class PlannedGoalsFormatter {
  private readonly yamlFormatter: YamlFormatter;

  constructor() {
    this.yamlFormatter = new YamlFormatter();
  }

  /**
   * Format planned goals as pure YAML
   *
   * @param goals - Array of GoalView projections with status='to-do'
   * @returns YAML string with planned goals context
   */
  format(goals: GoalView[]): string {
    if (goals.length === 0) {
      return this.formatNoPlannedGoals();
    }

    return this.yamlFormatter.toYaml({
      plannedGoals: {
        count: goals.length,
        goals: goals.map((g) => ({
          goalId: g.goalId,
          objective: g.objective,
          status: g.status,
          createdAt: g.createdAt,
        })),
      },
    });
  }

  /**
   * Format message when no planned goals exist
   */
  private formatNoPlannedGoals(): string {
    return this.yamlFormatter.toYaml({
      plannedGoals: {
        count: 0,
        message: "No planned goals available. Use 'jumbo goal add' to create a new goal to work on.",
      },
    });
  }
}
