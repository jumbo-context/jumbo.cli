/**
 * Infrastructure: Cursor Configurer
 *
 * Encapsulates all knowledge about Cursor configuration:
 * - CURSOR.md with reference to AGENTS.md
 * - .cursor/rules/jumbo/RULE.md with Jumbo instructions
 *
 * Note: Cursor doesn't have SessionStart hooks like Claude/Gemini.
 * Instead, it uses rules that auto-inject at the start of model context.
 * Cursor also reads AGENTS.md directly, so our shared instructions apply.
 *
 * Operations are idempotent and gracefully handle errors.
 */

import path from "path";
import fs from "fs-extra";
import { AgentInstructions } from "../../../../domain/project-knowledge/project/AgentInstructions.js";

export class CursorConfigurer {
  /**
   * Configure all Cursor requirements for Jumbo
   *
   * @param projectRoot Absolute path to project root directory
   */
  async configure(projectRoot: string): Promise<void> {
    await this.ensureCursorMd(projectRoot);
    await this.ensureCursorRule(projectRoot);
  }

  /**
   * Ensure CURSOR.md exists with reference to AGENTS.md
   */
  private async ensureCursorMd(projectRoot: string): Promise<void> {
    const cursorMdPath = path.join(projectRoot, "CURSOR.md");
    const reference = AgentInstructions.getAgentFileReference();

    try {
      const exists = await fs.pathExists(cursorMdPath);

      if (!exists) {
        // File doesn't exist - create with reference
        await fs.writeFile(cursorMdPath, reference.trim() + "\n", "utf-8");
        return;
      }

      // File exists - check if reference is present
      const content = await fs.readFile(cursorMdPath, "utf-8");

      if (!content.includes("AGENTS.md")) {
        // Reference missing - append it
        const updatedContent = content.trimEnd() + "\n" + reference;
        await fs.writeFile(cursorMdPath, updatedContent, "utf-8");
      }
      // else: Reference already present - no-op
    } catch (error) {
      // Graceful degradation - log but don't throw
      console.warn(
        `Warning: Failed to update CURSOR.md: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Ensure Cursor rule exists in .cursor/rules/jumbo/RULE.md
   *
   * Cursor rules use YAML frontmatter with markdown content.
   * The "alwaysApply: true" ensures Jumbo context is always available.
   */
  private async ensureCursorRule(projectRoot: string): Promise<void> {
    const ruleDir = path.join(projectRoot, ".cursor", "rules", "jumbo");
    const rulePath = path.join(ruleDir, "RULE.md");

    try {
      // Ensure directory exists
      await fs.ensureDir(ruleDir);

      const exists = await fs.pathExists(rulePath);

      if (!exists) {
        // Create rule with frontmatter
        const ruleContent = this.getJumboRuleContent();
        await fs.writeFile(rulePath, ruleContent, "utf-8");
        return;
      }

      // File exists - check if Jumbo marker is present
      const content = await fs.readFile(rulePath, "utf-8");
      const jumboMarker = AgentInstructions.getJumboSectionMarker();

      if (!content.includes(jumboMarker)) {
        // Jumbo content missing - recreate file
        const ruleContent = this.getJumboRuleContent();
        await fs.writeFile(rulePath, ruleContent, "utf-8");
      }
      // else: Jumbo content already present - no-op
    } catch (error) {
      // Graceful degradation - log but don't throw
      console.warn(
        `Warning: Failed to update .cursor/rules/jumbo/RULE.md: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Generate the Jumbo rule content with YAML frontmatter
   */
  private getJumboRuleContent(): string {
    const frontmatter = `---
description: Jumbo context management instructions
alwaysApply: true
---

`;
    return frontmatter + AgentInstructions.getJumboSection();
  }
}
