/**
 * CompleteGoalPromptService
 *
 * Service responsible for generating LLM prompts for goal completion.
 * Encapsulates prompt logic and maintains consistency across modes.
 */
export class CompleteGoalPromptService {
  /**
   * Generate Quality Assurance prompt for verifying work against goal criteria.
   * This prompt instructs the LLM to check its work and fix any inconsistencies.
   *
   * @param goalId - The goal ID to include in the prompt
   */
  generateQAPrompt(goalId: string): string {
    const lines = [
      "@LLM: Quality Assurance Check",
      "Review your work against the goal criteria below.",
      "REQUIRED ACTIONS:",
      "  1. Verify each criterion is met, guideline followed, and invariant upheld",
      "  2. If any criterion is not met, guideline not followed, or invariant not upheld, then fix the issues immediately",
      `  3. Only run 'jumbo goal complete --goal-id ${goalId} --commit' after ALL criteria, guidelines, and invariants are satisfied`,
      "",
      "This is a verification loop - you MUST ensure all criteria are met before committing.",
    ];
    return lines.join("\n");
  }

  /**
   * Generate learnings reflection prompt after goal completion.
   * This prompt instructs the LLM to reflect on learnings and propose additions to project memory.
   */
  generateLearningsPrompt(): string {
    const lines = [
      "@LLM: Reflect briefly. Did this goal surface anything that future sessions MUST know?",
      "Only propose additions if they are:",
      "  • Universal (applies beyond this specific goal)",
      "  • Dense (one sentence, no examples unless the example IS the rule)",
      "  • Actionable (changes how code is written or decisions are made)",
      "Capturable types: invariant, guideline, decision, component, dependency, architecture.",
      "If nothing qualifies, say so. Avoid restating what's already captured.",
      "Run 'jumbo --help' for command details.",
    ];
    return lines.join("\n");
  }
}
