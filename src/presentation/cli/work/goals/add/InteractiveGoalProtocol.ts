/**
 * InteractiveGoalProtocol
 *
 * Generates an LLM-mediation protocol for guided goal creation.
 * Outputs structured instructions and entity lists that guide an LLM
 * through the goal creation process, culminating in a final command.
 *
 * This is NOT a TUI - it outputs text for LLM consumption.
 */

import { IComponentContextReader } from "../../../../../application/work/goals/get-context/IComponentContextReader.js";
import { IGuidelineContextReader } from "../../../../../application/work/goals/get-context/IGuidelineContextReader.js";
import { IInvariantContextReader } from "../../../../../application/work/goals/get-context/IInvariantContextReader.js";
import { IDecisionContextReader } from "../../../../../application/work/goals/get-context/IDecisionContextReader.js";
import { ComponentView } from "../../../../../application/solution/components/ComponentView.js";
import { GuidelineView } from "../../../../../application/solution/guidelines/GuidelineView.js";
import { InvariantView } from "../../../../../application/solution/invariants/InvariantView.js";
import { DecisionView } from "../../../../../application/solution/decisions/DecisionView.js";

export interface InteractiveProtocolDependencies {
  componentReader: IComponentContextReader;
  guidelineReader: IGuidelineContextReader;
  invariantReader: IInvariantContextReader;
  decisionReader: IDecisionContextReader;
}

export class InteractiveGoalProtocol {
  constructor(private readonly deps: InteractiveProtocolDependencies) {}

  /**
   * Generate the full protocol output
   */
  async generate(): Promise<string> {
    // Fetch all entities in parallel
    const [components, guidelines, invariants, decisions] = await Promise.all([
      this.deps.componentReader.findAll(),
      this.deps.guidelineReader.findAll(),
      this.deps.invariantReader.findAll(),
      this.deps.decisionReader.findAllActive(),
    ]);

    // Build protocol sections
    const sections: string[] = [
      this.buildHeader(),
      this.buildObjectiveStep(),
      this.buildComponentsStep(components),
      this.buildInvariantsStep(invariants),
      this.buildGuidelinesStep(guidelines.filter(g => !g.isRemoved)),
      this.buildDecisionsStep(decisions),
      this.buildCriteriaStep(),
      this.buildFilesStep(),
      this.buildFinalCommand(),
    ];

    return sections.join("\n\n---\n\n");
  }

  private buildHeader(): string {
    return `@LLM: Interactive Goal Creation Protocol

Follow these steps sequentially to define a comprehensive goal.
Present options to the user, gather selections, then execute the final command.`;
  }

  private buildObjectiveStep(): string {
    return `## Step 1: Define Objective

Ask the user for a clear, concise goal objective (1-2 sentences).
This describes WHAT needs to be accomplished and WHY.

Example: "Implement JWT authentication for API endpoints to secure user data"`;
  }

  private buildComponentsStep(components: ComponentView[]): string {
    if (components.length === 0) {
      return `## Step 2: Select Relevant Components

No components defined yet. Skip this step.
(Components can be added with: jumbo component add)`;
    }

    const activeComponents = components.filter(c => c.status === 'active');
    if (activeComponents.length === 0) {
      return `## Step 2: Select Relevant Components

No active components available. Skip this step.`;
    }

    const numbered = this.formatNumberedList(
      activeComponents,
      (c, i) => `  ${i + 1}. ${c.name} - ${c.description}`
    );

    return `## Step 2: Select Relevant Components

Components define the architectural scope for this goal.

Available Components:
${numbered}

Instructions:
- Ask user which components are IN scope (by number or name)
- Ask user which components are OUT of scope (optional)
- Record component names for --scope-in and --scope-out flags
- For embedded context, record as: [{name, responsibility}]`;
  }

  private buildInvariantsStep(invariants: InvariantView[]): string {
    if (invariants.length === 0) {
      return `## Step 3: Select Relevant Invariants

No invariants defined yet. Skip this step.
(Invariants can be added with: jumbo invariant add)`;
    }

    const numbered = this.formatNumberedList(
      invariants,
      (inv, i) => `  ${i + 1}. ${inv.title} - ${inv.description}`
    );

    return `## Step 3: Select Relevant Invariants

Invariants are non-negotiable constraints that must be maintained.

Available Invariants:
${numbered}

Instructions:
- Present these to the user
- Ask which invariants apply to this goal
- Record selected as: [{title, description, rationale?}]`;
  }

  private buildGuidelinesStep(guidelines: GuidelineView[]): string {
    if (guidelines.length === 0) {
      return `## Step 4: Select Relevant Guidelines

No guidelines defined yet. Skip this step.
(Guidelines can be added with: jumbo guideline add)`;
    }

    const numbered = this.formatNumberedList(
      guidelines,
      (g, i) => `  ${i + 1}. [${g.category}] ${g.title} - ${g.description}`
    );

    return `## Step 4: Select Relevant Guidelines

Guidelines are coding standards and practices to follow.

Available Guidelines:
${numbered}

Instructions:
- Present these to the user
- Ask which guidelines are most relevant to this goal
- Record selected as: [{title, description, rationale?, examples?}]`;
  }

  private buildDecisionsStep(decisions: DecisionView[]): string {
    if (decisions.length === 0) {
      return `## Step 5: Review Active Decisions

No active decisions recorded. Skip this step.
(Decisions can be added with: jumbo decision add)`;
    }

    const numbered = this.formatNumberedList(
      decisions,
      (d, i) => `  ${i + 1}. ${d.title} - ${d.context}`
    );

    return `## Step 5: Review Active Decisions

Decisions are architectural choices that inform implementation.

Active Decisions:
${numbered}

Instructions:
- Present these for user awareness
- Decisions provide context but are NOT embedded in the goal
- User should consider these when defining the goal`;
  }

  private buildCriteriaStep(): string {
    return `## Step 6: Define Success Criteria

Ask the user for measurable success criteria.

Format: Multiple distinct, testable outcomes.

Examples:
- "JWT tokens are generated on successful login"
- "Protected endpoints return 401 without valid token"
- "Token expiration is enforced"

Instructions:
- Each criterion should be specific and verifiable
- Gather multiple criteria as separate items for --criteria flag`;
  }

  private buildFilesStep(): string {
    return `## Step 7: Specify Files (Optional)

Ask user for file information:

Files to Create (new files this goal will add):
- Example: "src/auth/JwtService.ts", "src/middleware/AuthMiddleware.ts"

Files to Change (existing files this goal will modify):
- Example: "src/routes/api.ts", "src/config/security.ts"

Instructions:
- This is optional but helps with planning
- Use relative paths from project root`;
  }

  private buildFinalCommand(): string {
    return `## Final Command

Execute this command with gathered data:

\`\`\`bash
jumbo goal add \\
  --objective "<objective from step 1>" \\
  --criteria "<criterion1>" "<criterion2>" "<criterion3>" \\
  --scope-in <component1> <component2> \\
  --scope-out <component3> \\
  --boundary "<boundary1>" \\
  --relevant-invariants '[{"title":"...","description":"..."}]' \\
  --relevant-guidelines '[{"title":"...","description":"..."}]' \\
  --relevant-components '[{"name":"...","responsibility":"..."}]' \\
  --files-to-create "<file1>" "<file2>" \\
  --files-to-change "<file1>" "<file2>"
\`\`\`

Notes:
- Only include flags with user-provided values
- JSON arrays must be properly escaped for shell
- Component names in --scope-in/--scope-out should match exactly
- Use single quotes around JSON to avoid shell escaping issues`;
  }

  private formatNumberedList<T>(
    items: T[],
    formatter: (item: T, index: number) => string
  ): string {
    return items.map((item, i) => formatter(item, i)).join("\n");
  }
}
