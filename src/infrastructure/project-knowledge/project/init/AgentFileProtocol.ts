/**
 * Infrastructure: Agent File Protocol Implementation
 *
 * Orchestrates AI agent configuration during project initialization.
 * Delegates agent-specific logic to dedicated Configurer classes.
 *
 * Extension:
 * To add a new agent, create a *Configurer class that implements
 * configure(projectRoot: string): Promise<void>, then add it to the
 * configurers array below. No changes to IAgentFileProtocol needed.
 *
 * Operations are idempotent and gracefully handle errors to avoid
 * failing project initialization if file writes fail.
 */

import path from "path";
import fs from "fs-extra";
import { IAgentFileProtocol } from "../../../../application/project-knowledge/project/init/IAgentFileProtocol.js";
import { AgentInstructions } from "../../../../domain/project-knowledge/project/AgentInstructions.js";
import { ClaudeConfigurer } from "./ClaudeConfigurer.js";
import { GeminiConfigurer } from "./GeminiConfigurer.js";
import { CopilotConfigurer } from "./CopilotConfigurer.js";

export class AgentFileProtocol implements IAgentFileProtocol {
  private readonly configurers = [
    new ClaudeConfigurer(),
    new GeminiConfigurer(),
    new CopilotConfigurer(),
  ];

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
   * Ensure all supported agents are configured for Jumbo
   */
  async ensureAgentConfigurations(projectRoot: string): Promise<void> {
    for (const configurer of this.configurers) {
      await configurer.configure(projectRoot);
    }
  }
}
