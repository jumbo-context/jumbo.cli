import { SessionSummaryProjection } from "../../../../../application/work/sessions/SessionSummaryView.js";
import { YamlFormatter } from "../../../shared/formatting/YamlFormatter.js";

/**
 * SessionSummaryFormatter - Formats session summary for LLM orientation context
 *
 * Renders the historical context from the previous/current session:
 * - What was worked on (completed goals)
 * - What blockers were encountered
 * - What decisions were made
 *
 * Output Format: YAML (more LLM-friendly than JSON)
 *
 * Usage:
 *   const formatter = new SessionSummaryFormatter();
 *   const contextMarkdown = formatter.format(sessionSummary);
 */
export class SessionSummaryFormatter {
  private readonly yamlFormatter: YamlFormatter;

  constructor() {
    this.yamlFormatter = new YamlFormatter();
  }

  /**
   * Format session summary as pure YAML
   *
   * @param summary - SessionSummaryProjection to format
   * @param hasSolutionContext - Whether the project has any solution context recorded
   * @returns YAML string with session context
   */
  format(summary: SessionSummaryProjection | null, hasSolutionContext: boolean): string {
    // Show brownfield instructions if no solution context exists,
    // regardless of whether a session summary exists
    if (!hasSolutionContext) {
      return this.formatInitialBrownfieldSession();
    }

    // No session summary but has solution context - just return empty session context
    if (!summary) {
      return this.yamlFormatter.toYaml({
        sessionContext: {
          message: "No previous session context available.",
        },
      });
    }

    const contextData: any = {
      sessionContext: {
        focus: summary.focus,
        status: summary.status,
      },
    };

    // Only include sections with data
    if (summary.completedGoals.length > 0) {
      contextData.sessionContext.completedGoals = summary.completedGoals.map((g) => ({
        goalId: g.goalId,
        objective: g.objective,
        status: g.status,
        createdAt: g.createdAt,
      }));
    }

    if (summary.blockersEncountered.length > 0) {
      contextData.sessionContext.blockersEncountered = summary.blockersEncountered.map((b) => ({
        goalId: b.goalId,
        reason: b.reason,
      }));
    }

    if (summary.decisions.length > 0) {
      contextData.sessionContext.decisions = summary.decisions.map((d) => ({
        decisionId: d.decisionId,
        title: d.title,
        rationale: d.rationale,
      }));
    }

    return this.yamlFormatter.toYaml(contextData);
  }

  /**
   * Format message when no session summary exists (first-ever session on brownfield project)
   *
   * Outputs direct LLM instructions that cause the agent to proactively offer
   * to help transfer existing project context into Jumbo.
   */
  private formatInitialBrownfieldSession(): string {
    // Use info-style output to provide context
    const contextInfo = this.yamlFormatter.toYaml({
      sessionContext: {
        message: "No previous session context available. This appears to be your first session with Jumbo on this project.",
      },
    });

    // Direct @LLM instruction that primes conversational, proactive behavior
    const llmInstruction = [
      "",
      "@LLM: This is a BROWNFIELD PROJECT with no Jumbo context yet.",
      "",
      "REQUIRED ACTION: Proactively engage the user with the following approach:",
      "",
      '1. GREET and ACKNOWLEDGE: "Hi! I can see that you\'ve added Jumbo to this project. ',
      '   This looks like an existing codebase with valuable context to preserve."',
      "",
      '2. OFFER HELP: "Would you like me to help transfer your existing project knowledge into Jumbo? ',
      '   I can scan your documentation, code structure, and patterns to capture:"',
      "   - Project purpose and target audience (from README, docs)",
      "   - Architectural components and dependencies (from code structure)",
      "   - Development guidelines and coding standards (from patterns)",
      "   - Architectural decisions (from docs, comments, ADRs)",
      "",
      '3. GET PERMISSION: "I\'ll ask for your confirmation before adding anything to Jumbo. ',
      '   Should we start by scanning your project documentation?"',
      "",
      "IMPORTANT:",
      "- Take initiative: Don't wait passively. Actively offer to help.",
      "- Be conversational: Use natural language, not robotic instructions.",
      "- Human-in-the-loop: Always get user confirmation before running jumbo commands.",
      "- Start with docs: README.md, package.json, or docs/ are good starting points.",
      "",
      "AVAILABLE COMMANDS (use after getting user permission):",
      "- jumbo architecture define --help",
      "- jumbo component add --name 'ComponentName' --description 'What it does'",
      "- jumbo decision add --title 'Decision' --rationale 'Why' --context 'Background'",
      "- jumbo guideline add --category 'testing' --description 'Guideline text'",
      "- jumbo invariant add --category 'architecture' --description 'Non-negotiable rule'",
      "",
      "Run 'jumbo --help' to see all available commands.",
    ].join("\n");

    return contextInfo + llmInstruction;
  }
}
