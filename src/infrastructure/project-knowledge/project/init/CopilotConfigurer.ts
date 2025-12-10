/**
 * Infrastructure: GitHub Copilot Configurer
 *
 * Encapsulates all knowledge about GitHub Copilot configuration:
 * - .github/copilot-instructions.md with Jumbo instructions
 *
 * Note: Copilot does not support SessionStart hooks, so configuration
 * is limited to static instruction files.
 *
 * Operations are idempotent and gracefully handle errors.
 */

import path from "path";
import fs from "fs-extra";
import { AgentInstructions } from "../../../../domain/project-knowledge/project/AgentInstructions.js";

export class CopilotConfigurer {
  /**
   * Configure all GitHub Copilot requirements for Jumbo
   *
   * @param projectRoot Absolute path to project root directory
   */
  async configure(projectRoot: string): Promise<void> {
    await this.ensureCopilotInstructions(projectRoot);
  }

  /**
   * Ensure GitHub Copilot instructions exist in .github/copilot-instructions.md
   */
  private async ensureCopilotInstructions(projectRoot: string): Promise<void> {
    const copilotInstructionsPath = path.join(
      projectRoot,
      ".github",
      "copilot-instructions.md"
    );

    try {
      // Ensure .github directory exists
      await fs.ensureDir(path.join(projectRoot, ".github"));

      const exists = await fs.pathExists(copilotInstructionsPath);

      if (!exists) {
        // File doesn't exist - create with Jumbo section
        await fs.writeFile(
          copilotInstructionsPath,
          AgentInstructions.getCopilotInstructions(),
          "utf-8"
        );
        return;
      }

      // File exists - check if Jumbo section is present
      const content = await fs.readFile(copilotInstructionsPath, "utf-8");
      const jumboMarker = AgentInstructions.getJumboSectionMarker();

      if (!content.includes(jumboMarker)) {
        // Jumbo section missing - append it
        const updatedContent =
          content + "\n\n" + AgentInstructions.getCopilotInstructions();
        await fs.writeFile(copilotInstructionsPath, updatedContent, "utf-8");
      }
      // else: Jumbo section already present - no-op
    } catch (error) {
      // Graceful degradation - log but don't throw
      console.warn(
        `Warning: Failed to update .github/copilot-instructions.md: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
