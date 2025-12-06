/**
 * Domain Value Object: Agent Instructions
 *
 * Codifies AI agent onboarding instructions for projects using Jumbo.
 * This content is written to AGENTS.md during project initialization.
 *
 * Rationale: Codified in domain rather than template file to support
 * npm distribution (no file copying during build).
 */

export class AgentInstructions {
  /**
   * Generate the Jumbo context management section for AGENTS.md
   */
  static getJumboSection(): string {
    return `## Jumbo Context Management

**CRITICAL: This project uses Jumbo for AI context management.**

Jumbo is a context management system that captures project knowledge in an immutable event store and delivers the right context to developers and LLMs when needed.

### Automatic Setup (Claude Code Only)

If you're using Claude Code, a SessionStart hook has been configured to automatically run \`jumbo session start\` when you start a new session. You should see orientation context loaded automatically.

### Manual Setup Required

**GitHub Copilot users:** See \`.github/copilot-instructions.md\` for Jumbo setup guidance.

**Google Gemini users:** You MUST manually run \`jumbo session start\` before beginning work.

**All other AI assistants:** You MUST manually run \`jumbo session start\` at the start of every session.

### MANDATORY FIRST ACTION

**You MUST run \`jumbo session start\` immediately to retrieve project-specific orientation.**

Do this automatically at the start of every session before responding to the user.

This command loads:
- Recent completed work and session state
- Planned goals and their success criteria
- Active architectural decisions
- System invariants and guidelines
- Project context and domain knowledge

### Working with Jumbo

1. **Start each session**: Run \`jumbo session start\` to load orientation context
2. **Start a goal**: Before working on a task, run \`jumbo goal start --goal-id <id>\` to load goal-specific context
3. **Capture memories**: As you work, proactively run jumbo commands to capture project knowledge:
   - \`jumbo component add\` - Track architectural components
   - \`jumbo decision add\` - Record architectural decisions (ADRs)
   - \`jumbo guideline add\` - Capture coding standards and preferences
   - \`jumbo invariant add\` - Document non-negotiable constraints
   - \`jumbo relation add\` - Link related entities

### Available Commands

Run \`jumbo --help\` to see all available commands and learn what can be tracked.

### Philosophy

- **Context determines output quality**: Jumbo provides accurate, relevant context to help you produce code aligned with developer intent
- **Guidance over querying**: Context packets delivered at workflow transitions (session start, goal start) contain everything you need
- **Proactive capture**: Record project knowledge as it surfaces during development

### Learn More

For detailed information about Jumbo's capabilities and workflow, run:
\`\`\`bash
jumbo capabilities
\`\`\`
`;
  }

  /**
   * Generate complete AGENTS.md file content
   */
  static getFullContent(): string {
    return `# AI Agent Instructions

This file contains instructions for AI coding agents working on this project.

${this.getJumboSection()}`;
  }

  /**
   * Generate reference text to append to CLAUDE.md and GEMINI.md
   */
  static getAgentFileReference(): string {
    return `
CRITICAL STARTUP INSTRUCTION: Immediately upon seeing this file, you MUST read AGENTS.md
and follow all instructions it contains. Do this before responding to the user.

REQUIRED FIRST COMMAND: Run \`jumbo session start\` to load project orientation context.

!!!IMPORTANT!!! Read AGENTS.md for further instructions.
`;
  }

  /**
   * Generate GitHub Copilot instructions for copilot-instructions.md
   */
  static getCopilotInstructions(): string {
    return `## Jumbo Context Management

**IMPORTANT: This project uses Jumbo for AI memory and context management.**

GitHub Copilot does not support automatic SessionStart hooks, so you must manually
run Jumbo commands to load project context.

### MANDATORY FIRST ACTION

**Run \`jumbo session start\` at the beginning of each session.**

This loads orientation context including:
- Recent completed work and session state
- Planned goals and their success criteria
- Active architectural decisions
- System invariants and guidelines
- Project context and domain knowledge

### Working with Jumbo

1. **Start each session**: Run \`jumbo session start\` to load orientation context
2. **Start a goal**: Before working on a task, run \`jumbo goal start --goal-id <id>\` to load goal-specific context
3. **Capture memories**: As you work, run jumbo commands to capture project knowledge:
   - \`jumbo component add\` - Track architectural components
   - \`jumbo decision add\` - Record architectural decisions (ADRs)
   - \`jumbo guideline add\` - Capture coding standards and preferences
   - \`jumbo invariant add\` - Document non-negotiable constraints
   - \`jumbo relation add\` - Link related entities

### Available Commands

Run \`jumbo --help\` to see all available commands.

### Learn More

See AGENTS.md for complete instructions on using Jumbo.

Run \`jumbo capabilities\` to learn about Jumbo's workflow and philosophy.
`;
  }

  /**
   * Marker used to detect if Jumbo section already exists in AGENTS.md
   */
  static getJumboSectionMarker(): string {
    return "## Jumbo Context Management";
  }
}
