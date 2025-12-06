/**
 * Port: Agent File Protocol
 *
 * Defines interface for managing AI agent instruction files and configuration during project initialization.
 *
 * Responsibilities:
 * - Ensure AGENTS.md exists with Jumbo instructions
 * - Ensure CLAUDE.md and GEMINI.md reference AGENTS.md
 * - Ensure Claude Code SessionStart hook is configured
 * - Ensure GitHub Copilot instructions are created
 *
 * Design Notes:
 * - Operations are idempotent (safe to run multiple times)
 * - Side effects only (no domain events emitted)
 * - Errors logged but don't fail initialization (graceful degradation)
 */

export interface IAgentFileProtocol {
  /**
   * Ensure AGENTS.md exists with Jumbo instructions.
   *
   * Behavior:
   * - If AGENTS.md doesn't exist: Create it with full content
   * - If AGENTS.md exists without Jumbo section: Append Jumbo section
   * - If AGENTS.md exists with Jumbo section: No-op
   *
   * @param projectRoot Absolute path to project root directory
   */
  ensureAgentsMd(projectRoot: string): Promise<void>;

  /**
   * Ensure CLAUDE.md and GEMINI.md reference AGENTS.md.
   *
   * Behavior:
   * - If file doesn't exist: Create it with reference
   * - If file exists without reference: Append reference
   * - If file exists with reference: No-op
   *
   * @param projectRoot Absolute path to project root directory
   */
  ensureAgentFileReferences(projectRoot: string): Promise<void>;

  /**
   * Ensure Claude Code SessionStart hook is configured in .claude/settings.json.
   *
   * Behavior:
   * - Creates .claude/ directory if it doesn't exist
   * - If settings.json doesn't exist: Create it with SessionStart hook
   * - If settings.json exists: Merge SessionStart hook (preserves existing config)
   * - Creates timestamped backup before modification
   * - Idempotent: Safe to run multiple times
   *
   * Hook Configuration:
   * Adds `jumbo session start` command to SessionStart.startup matcher
   *
   * @param projectRoot Absolute path to project root directory
   */
  ensureClaudeSettings(projectRoot: string): Promise<void>;

  /**
   * Ensure GitHub Copilot instructions exist in .github/copilot-instructions.md.
   *
   * Behavior:
   * - Creates .github/ directory if it doesn't exist
   * - If copilot-instructions.md doesn't exist: Create it with Jumbo section
   * - If copilot-instructions.md exists without Jumbo section: Append Jumbo section
   * - If copilot-instructions.md exists with Jumbo section: No-op
   *
   * Note: Copilot has no SessionStart hooks, so instructions are static guidance
   *
   * @param projectRoot Absolute path to project root directory
   */
  ensureCopilotInstructions(projectRoot: string): Promise<void>;
}
