import { GoalContextView } from "../../../../../application/work/goals/get-context/GoalContextView.js";
import { YamlFormatter } from "../../../shared/formatting/YamlFormatter.js";

/**
 * GoalContextFormatter - Formats goal context for LLM
 *
 * Renders focused, token-optimized context when starting a goal:
 * - Category 1: Work (Goal details)
 * - Category 2: Solution (Components, dependencies, decisions - filtered by scope)
 * - Category 3: Invariants & Boundaries
 * - Category 4: Execution Guidelines
 * - Category 5: Relations
 *
 * Output Format: Markdown with YAML blocks (LLM-friendly)
 *
 * Usage:
 *   const formatter = new GoalContextFormatter();
 *   const contextMarkdown = formatter.format(goalContext);
 */
export class GoalContextFormatter {
  private readonly yamlFormatter: YamlFormatter;

  constructor() {
    this.yamlFormatter = new YamlFormatter();
  }

  /**
   * Format goal context as pure YAML
   *
   * @param context - GoalContextView to format
   * @returns YAML string with goal context
   */
  format(context: GoalContextView): string {
    const goalContext: any = {
      goalContext: {
        // Category 1: Active Work
        goal: {
          goalId: context.goal.goalId,
          objective: context.goal.objective,
          status: context.goal.status,
          successCriteria: context.goal.successCriteria,
          scope: {
            in: context.goal.scopeIn,
            out: context.goal.scopeOut,
          },
          boundaries: context.goal.boundaries,
        },
      },
    };

    // Category 2: Solution Context (only if data exists)
    if (
      context.components.length > 0 ||
      context.dependencies.length > 0 ||
      context.decisions.length > 0
    ) {
      goalContext.goalContext.solution = {};

      if (context.components.length > 0) {
        goalContext.goalContext.solution.components = context.components.map((c) => ({
          name: c.name,
          description: c.description,
          status: c.status,
        }));
      }

      if (context.dependencies.length > 0) {
        goalContext.goalContext.solution.dependencies = context.dependencies.map((d) => ({
          name: d.name,
          version: d.version,
          purpose: d.purpose,
        }));
      }

      if (context.decisions.length > 0) {
        goalContext.goalContext.solution.decisions = context.decisions.map((d) => ({
          title: d.title,
          rationale: d.rationale,
          status: d.status,
        }));
      }
    }

    // Category 3: Constraints (only if data exists)
    if (context.invariants.length > 0) {
      goalContext.goalContext.invariants = context.invariants.map((inv) => ({
        category: inv.category,
        description: inv.description,
      }));
    }

    // Category 4: Execution Guidelines (only if data exists)
    if (context.guidelines.length > 0) {
      goalContext.goalContext.guidelines = context.guidelines.map((g) => ({
        category: g.category,
        description: g.description,
      }));
    }

    // Category 5: Relations (only if data exists)
    if (context.relations.length > 0) {
      goalContext.goalContext.relations = context.relations.map((r) => ({
        from: r.fromEntityId,
        to: r.toEntityId,
        type: r.relationType,
        description: r.description,
      }));
    }

    return this.yamlFormatter.toYaml(goalContext);
  }
}
