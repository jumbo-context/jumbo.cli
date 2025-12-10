/**
 * Infrastructure: Gemini CLI Configurer
 *
 * Encapsulates all knowledge about Gemini CLI configuration:
 * - GEMINI.md with reference to AGENTS.md
 * - .gemini/settings.json with SessionStart hooks
 *
 * Operations are idempotent and gracefully handle errors.
 */

import path from "path";
import fs from "fs-extra";
import { AgentInstructions } from "../../../../domain/project-knowledge/project/AgentInstructions.js";
import { SafeGeminiSettingsMerger } from "./SafeGeminiSettingsMerger.js";

export class GeminiConfigurer {
  /**
   * Configure all Gemini CLI requirements for Jumbo
   *
   * @param projectRoot Absolute path to project root directory
   */
  async configure(projectRoot: string): Promise<void> {
    await this.ensureGeminiMd(projectRoot);
    await this.ensureGeminiSettings(projectRoot);
  }

  /**
   * Ensure GEMINI.md exists with reference to AGENTS.md
   */
  private async ensureGeminiMd(projectRoot: string): Promise<void> {
    const geminiMdPath = path.join(projectRoot, "GEMINI.md");
    const reference = AgentInstructions.getAgentFileReference();

    try {
      const exists = await fs.pathExists(geminiMdPath);

      if (!exists) {
        // File doesn't exist - create with reference
        await fs.writeFile(geminiMdPath, reference.trim() + "\n", "utf-8");
        return;
      }

      // File exists - check if reference is present
      const content = await fs.readFile(geminiMdPath, "utf-8");

      if (!content.includes("AGENTS.md")) {
        // Reference missing - append it
        const updatedContent = content.trimEnd() + "\n" + reference;
        await fs.writeFile(geminiMdPath, updatedContent, "utf-8");
      }
      // else: Reference already present - no-op
    } catch (error) {
      // Graceful degradation - log but don't throw
      console.warn(
        `Warning: Failed to update GEMINI.md: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Ensure Gemini CLI SessionStart hook is configured in .gemini/settings.json
   */
  private async ensureGeminiSettings(projectRoot: string): Promise<void> {
    try {
      // Define the SessionStart hook for Jumbo
      const jumboHook = {
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
          ],
        },
      };

      // Merge into existing settings (or create new)
      await SafeGeminiSettingsMerger.mergeSettings(projectRoot, jumboHook);
    } catch (error) {
      // Graceful degradation - log but don't throw
      console.warn(
        `Warning: Failed to configure Gemini CLI hook: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
