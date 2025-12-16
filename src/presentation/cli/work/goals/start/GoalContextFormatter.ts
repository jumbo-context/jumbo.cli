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
   * Prefers embedded context when available (from --interactive goal creation).
   * Falls back to queried context for legacy goals.
   *
   * @param context - GoalContextView to format
   * @returns YAML string with goal context
   */
  format(context: GoalContextView): string {
    // Build goal section with scope
    const goalSection: Record<string, unknown> = {
      goalId: context.goal.goalId,
      objective: context.goal.objective,
      status: context.goal.status,
      successCriteria: context.goal.successCriteria,
      scope: {
        in: context.goal.scopeIn,
        out: context.goal.scopeOut,
      },
      boundaries: context.goal.boundaries,
    };

    // Add files to create/change when present (embedded context)
    if (this.hasFilesToCreate(context)) {
      goalSection.filesToCreate = context.goal.filesToBeCreated;
    }
    if (this.hasFilesToChange(context)) {
      goalSection.filesToChange = context.goal.filesToBeChanged;
    }

    const inner: Record<string, unknown> = {
      // Category 1: Active Work
      goal: goalSection,
    };

    // Architecture section (embedded context from --interactive)
    if (this.hasArchitecture(context)) {
      inner.architecture = {
        description: context.goal.architecture!.description,
        organization: context.goal.architecture!.organization,
        ...(context.goal.architecture!.patterns?.length && { patterns: context.goal.architecture!.patterns }),
        ...(context.goal.architecture!.principles?.length && { principles: context.goal.architecture!.principles }),
      };
    }

    // Category 2: Solution Context (only if data exists)
    if (
      context.components.length > 0 ||
      context.dependencies.length > 0 ||
      context.decisions.length > 0
    ) {
      const solution: Record<string, unknown> = {};

      if (context.components.length > 0) {
        solution.components = context.components.map((c) => ({
          name: c.name,
          description: c.description,
          status: c.status,
        }));
      }

      if (context.dependencies.length > 0) {
        solution.dependencies = context.dependencies.map((d) => ({
          name: d.name,
          version: d.version,
          purpose: d.purpose,
        }));
      }

      if (context.decisions.length > 0) {
        solution.decisions = context.decisions.map((d) => ({
          title: d.title,
          rationale: d.rationale,
          status: d.status,
        }));
      }

      inner.solution = solution;
    }

    // Category 3: Constraints (only if data exists)
    if (context.invariants.length > 0) {
      inner.invariants = context.invariants.map((inv) => ({
        category: inv.category,
        description: inv.description,
      }));
    }

    // Category 4: Execution Guidelines (only if data exists)
    if (context.guidelines.length > 0) {
      inner.guidelines = context.guidelines.map((g) => ({
        category: g.category,
        description: g.description,
      }));
    }

    // Category 5: Relations (only if data exists)
    if (context.relations.length > 0) {
      inner.relations = context.relations.map((r) => ({
        from: r.fromEntityId,
        to: r.toEntityId,
        type: r.relationType,
        description: r.description,
      }));
    }

    return this.yamlFormatter.toYaml({ goalContext: inner });
  }

  /**
   * Check if goal has embedded architecture
   */
  private hasArchitecture(context: GoalContextView): boolean {
    return context.goal.architecture !== undefined && context.goal.architecture !== null;
  }

  /**
   * Check if goal has files to create
   */
  private hasFilesToCreate(context: GoalContextView): boolean {
    return Array.isArray(context.goal.filesToBeCreated) && context.goal.filesToBeCreated.length > 0;
  }

  /**
   * Check if goal has files to change
   */
  private hasFilesToChange(context: GoalContextView): boolean {
    return Array.isArray(context.goal.filesToBeChanged) && context.goal.filesToBeChanged.length > 0;
  }
}
