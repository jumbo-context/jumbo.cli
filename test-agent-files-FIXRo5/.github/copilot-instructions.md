## Jumbo Context Management

**IMPORTANT: This project uses Jumbo for AI memory and context management.**

GitHub Copilot does not support automatic SessionStart hooks, so you must manually
run Jumbo commands to load project context.

### MANDATORY FIRST ACTION

**Run `jumbo session start` at the beginning of each session.**

This loads orientation context including:
- Recent completed work and session state
- Planned goals and their success criteria
- Active architectural decisions
- System invariants and guidelines
- Project context and domain knowledge

### Working with Jumbo

1. **Start each session**: Run `jumbo session start` to load orientation context
2. **Start a goal**: Before working on a task, run `jumbo goal start --goal-id <id>` to load goal-specific context
3. **Capture memories**: As you work, run jumbo commands to capture project knowledge:
   - `jumbo component add` - Track architectural components
   - `jumbo decision add` - Record architectural decisions (ADRs)
   - `jumbo guideline add` - Capture coding standards and preferences
   - `jumbo invariant add` - Document non-negotiable constraints
   - `jumbo relation add` - Link related entities

### Available Commands

Run `jumbo --help` to see all available commands.

### Learn More

See AGENTS.md for complete instructions on using Jumbo.

Run `jumbo capabilities` to learn about Jumbo's workflow and philosophy.
