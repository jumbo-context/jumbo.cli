import { GoalView } from "../../../../../application/work/goals/GoalView.js";
import { YamlFormatter } from "../../../shared/formatting/YamlFormatter.js";

/**
 * InProgressGoalsFormatter - Formats in-progress goals for LLM orientation context
 *
 * Renders the current active work: what goals are currently being worked on.
 * Only shows goals with status='doing'.
 *
 * Output Format: YAML (more LLM-friendly than JSON)
 *
 * Usage:
 *   const formatter = new InProgressGoalsFormatter();
 *   const contextMarkdown = formatter.format(inProgressGoals);
 */
export class InProgressGoalsFormatter {
  private readonly yamlFormatter: YamlFormatter;

  constructor() {
    this.yamlFormatter = new YamlFormatter();
  }

  /**
   * Format in-progress goals as pure YAML
   *
   * @param goals - Array of GoalView projections with status='doing'
   * @returns YAML string with in-progress goals context
   */
  format(goals: GoalView[]): string {
    if (goals.length === 0) {
      return this.formatNoInProgressGoals();
    }

    return this.yamlFormatter.toYaml({
      inProgressGoals: {
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
   * Format message when no in-progress goals exist
   */
  private formatNoInProgressGoals(): string {
    return this.yamlFormatter.toYaml({
      inProgressGoals: {
        count: 0,
        message: "No goals currently in progress. Use 'jumbo goal start' to begin working on a goal.",
      },
    });
  }
}
