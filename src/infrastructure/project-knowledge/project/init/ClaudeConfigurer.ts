/**
 * Infrastructure: Claude Code Configurer
 *
 * Encapsulates all knowledge about Claude Code configuration:
 * - CLAUDE.md with reference to AGENTS.md
 * - .claude/settings.json with SessionStart hooks
 *
 * Use this as a reference when creating new agent Configurers.
 * Each Configurer must implement configure(projectRoot): Promise<void>.
 *
 * Operations are idempotent and gracefully handle errors.
 */

import path from "path";
import fs from "fs-extra";
import { AgentInstructions } from "../../../../domain/project-knowledge/project/AgentInstructions.js";
import { SafeClaudeSettingsMerger } from "./SafeClaudeSettingsMerger.js";

export class ClaudeConfigurer {
  /**
   * Configure all Claude Code requirements for Jumbo
   *
   * @param projectRoot Absolute path to project root directory
   */
  async configure(projectRoot: string): Promise<void> {
    await this.ensureClaudeMd(projectRoot);
    await this.ensureClaudeSettings(projectRoot);
  }

  /**
   * Ensure CLAUDE.md exists with reference to AGENTS.md
   */
  private async ensureClaudeMd(projectRoot: string): Promise<void> {
    const claudeMdPath = path.join(projectRoot, "CLAUDE.md");
    const reference = AgentInstructions.getAgentFileReference();

    try {
      const exists = await fs.pathExists(claudeMdPath);

      if (!exists) {
        // File doesn't exist - create with reference
        await fs.writeFile(claudeMdPath, reference.trim() + "\n", "utf-8");
        return;
      }

      // File exists - check if reference is present
      const content = await fs.readFile(claudeMdPath, "utf-8");

      if (!content.includes("AGENTS.md")) {
        // Reference missing - append it
        const updatedContent = content.trimEnd() + "\n" + reference;
        await fs.writeFile(claudeMdPath, updatedContent, "utf-8");
      }
      // else: Reference already present - no-op
    } catch (error) {
      // Graceful degradation - log but don't throw
      console.warn(
        `Warning: Failed to update CLAUDE.md: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Ensure Claude Code hooks are configured in .claude/settings.json
   */
  private async ensureClaudeSettings(projectRoot: string): Promise<void> {
    try {
      // Define all Jumbo hooks for Claude Code
      const jumboHooks = {
        hooks: {
          SessionStart: [
            {
              matcher: "startup" as const,
              hooks: [
                {
                  type: "command" as const,
                  command: "jumbo session start",
                },
              ],
            },
            {
              matcher: "compact" as const,
              hooks: [
                {
                  type: "command" as const,
                  command: "jumbo goal resume --goal-id {current-goal-id}",
                },
              ],
            },
          ],
          PreCompact: [
            {
              matcher: "auto" as const,
              hooks: [
                {
                  type: "prompt" as const,
                  prompt:
                    "When you are finished compactin context then run 'jumbo goal resume --goal-id <GOAL_ID>'with the goal of the current goal id, to get the required context to complete the goal.",
                },
              ],
            },
          ],
          SessionEnd: [
            {
              matcher: "exit" as const,
              hooks: [
                {
                  type: "command" as const,
                  command: "jumbo session end --focus {focus} --summary {summary}",
                },
              ],
            },
          ],
        },
      };

      // Merge into existing settings (or create new)
      await SafeClaudeSettingsMerger.mergeSettings(projectRoot, jumboHooks);
    } catch (error) {
      // Graceful degradation - log but don't throw
      console.warn(
        `Warning: Failed to configure Claude Code hooks: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
