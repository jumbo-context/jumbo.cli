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

  private static readonly HEADER = `---
@LLM: Please implement the goal below. All output should fulfill the objective and criteria. Work within scope and the operational boundaries presented.
You will naturally have interactions with the developer as you work on completing the goal. Heed the user's prompts for changes to the solution 'architecture', 'components', or 'dependencies', or the introduction of new 'guidelines' or 'invariants' and suggest to register them with jumbo when you encounter them in your exchanges. Run the following for registration details:
- 'jumbo architecture update --help'
- 'jumbo component --help'
- 'jumbo decision --help'
- 'jumbo dependency --help'
- 'jumbo guideline --help'
- 'jumbo invariant --help'

---`;

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
      criteria: context.goal.successCriteria,
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
        }));
      }

      inner.solution = solution;
    }

    // Category 3: Constraints (only if data exists)
    if (context.invariants.length > 0) {
      inner.invariants = context.invariants.map((inv) => ({
        title: inv.category,
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

    const yaml = this.yamlFormatter.toYaml({ goalContext: inner });
    const yamlWithComments = this.injectLlmComments(yaml);

    return `${GoalContextFormatter.HEADER}\n${yamlWithComments}`;
  }

  /**
   * Inject inline @LLM comments into YAML for section guidance
   */
  private injectLlmComments(yaml: string): string {
    const commentMap: Array<{ pattern: RegExp; comment: string }> = [
      {
        pattern: /^(  solution:)$/m,
        comment: "  # @LLM: Below are the contextual details of the solution your outputs must fit into.",
      },
      {
        pattern: /^(    components:)$/m,
        comment:
          "  # @LLM: These are the components relevant to this goal, but not necessarily all components comprising the solution.",
      },
      {
        pattern: /^(  invariants:)$/m,
        comment: "  # @LLM: The following are non-negotiable. Your outputs MUST adhere to each of the following invariants.",
      },
      {
        pattern: /^(  guidelines:)$/m,
        comment: "  # @LLM: Apply the following guidelines to your output where applicable.",
      },
    ];

    let result = yaml;
    for (const { pattern, comment } of commentMap) {
      result = result.replace(pattern, `${comment}\n$1`);
    }

    return result;
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
