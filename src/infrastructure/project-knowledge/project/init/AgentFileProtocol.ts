/**
 * Infrastructure: Agent File Protocol Implementation
 *
 * Manages AI agent instruction files (AGENTS.md, CLAUDE.md, GEMINI.md)
 * during project initialization.
 *
 * Operations are idempotent and gracefully handle errors to avoid
 * failing project initialization if file writes fail.
 */

import path from "path";
import fs from "fs-extra";
import { IAgentFileProtocol } from "../../../../application/project-knowledge/project/init/IAgentFileProtocol.js";
import { AgentInstructions } from "../../../../domain/project-knowledge/project/AgentInstructions.js";
import { SafeSettingsMerger } from "./SafeSettingsMerger.js";

export class AgentFileProtocol implements IAgentFileProtocol {
  /**
   * Ensure AGENTS.md exists with Jumbo instructions
   */
  async ensureAgentsMd(projectRoot: string): Promise<void> {
    const agentsMdPath = path.join(projectRoot, "AGENTS.md");

    try {
      const exists = await fs.pathExists(agentsMdPath);

      if (!exists) {
        // File doesn't exist - create with full content
        await fs.writeFile(agentsMdPath, AgentInstructions.getFullContent(), "utf-8");
        return;
      }

      // File exists - check if Jumbo section is present
      const content = await fs.readFile(agentsMdPath, "utf-8");
      const jumboMarker = AgentInstructions.getJumboSectionMarker();

      if (!content.includes(jumboMarker)) {
        // Jumbo section missing - append it
        const updatedContent = content + "\n\n" + AgentInstructions.getJumboSection();
        await fs.writeFile(agentsMdPath, updatedContent, "utf-8");
      }
      // else: Jumbo section already present - no-op
    } catch (error) {
      // Graceful degradation - log but don't throw
      console.warn(`Warning: Failed to update AGENTS.md: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Ensure CLAUDE.md and GEMINI.md reference AGENTS.md
   */
  async ensureAgentFileReferences(projectRoot: string): Promise<void> {
    const agentFiles = ["CLAUDE.md", "GEMINI.md"];
    const reference = AgentInstructions.getAgentFileReference();

    for (const fileName of agentFiles) {
      await this.ensureFileHasReference(projectRoot, fileName, reference);
    }
  }

  /**
   * Ensure Claude Code SessionStart hook is configured
   */
  async ensureClaudeSettings(projectRoot: string): Promise<void> {
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
      await SafeSettingsMerger.mergeSettings(projectRoot, jumboHook);
    } catch (error) {
      // Graceful degradation - log but don't throw
      console.warn(
        `Warning: Failed to configure Claude Code hook: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Ensure GitHub Copilot instructions exist
   */
  async ensureCopilotInstructions(projectRoot: string): Promise<void> {
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

  /**
   * Helper: Ensure a specific file has the AGENTS.md reference
   */
  private async ensureFileHasReference(
    projectRoot: string,
    fileName: string,
    reference: string
  ): Promise<void> {
    const filePath = path.join(projectRoot, fileName);

    try {
      const exists = await fs.pathExists(filePath);

      if (!exists) {
        // File doesn't exist - create with reference
        await fs.writeFile(filePath, reference.trim() + "\n", "utf-8");
        return;
      }

      // File exists - check if reference is present
      const content = await fs.readFile(filePath, "utf-8");

      if (!content.includes("AGENTS.md")) {
        // Reference missing - append it
        const updatedContent = content.trimEnd() + "\n" + reference;
        await fs.writeFile(filePath, updatedContent, "utf-8");
      }
      // else: Reference already present - no-op
    } catch (error) {
      // Graceful degradation - log but don't throw
      console.warn(`Warning: Failed to update ${fileName}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
