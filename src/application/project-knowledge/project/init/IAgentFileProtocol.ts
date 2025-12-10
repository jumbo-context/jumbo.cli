/**
 * Port: Agent File Protocol
 *
 * Defines interface for managing AI agent instruction files and configuration
 * during project initialization.
 *
 * Responsibilities:
 * - Ensure AGENTS.md exists with Jumbo instructions
 * - Ensure all supported agents are configured
 *
 * Design Notes:
 * - Operations are idempotent (safe to run multiple times)
 * - Side effects only (no domain events emitted)
 * - Errors logged but don't fail initialization (graceful degradation)
 * - Agent-specific knowledge is encapsulated in individual Configurer classes
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
   * Ensure all supported agents are configured for Jumbo.
   *
   * Orchestrates configuration for all supported agents by delegating
   * to each agent's dedicated Configurer class, which encapsulates
   * all knowledge about that agent's requirements.
   *
   * Behavior:
   * - Delegates to each agent's Configurer
   * - Each Configurer handles its own error recovery
   * - Failures in one agent don't affect others
   *
   * @param projectRoot Absolute path to project root directory
   */
  ensureAgentConfigurations(projectRoot: string): Promise<void>;
}
