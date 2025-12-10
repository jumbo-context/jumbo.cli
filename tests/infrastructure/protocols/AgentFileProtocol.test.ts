/**
 * Tests for AgentFileProtocol infrastructure implementation
 */

import * as fs from "fs-extra";
import * as path from "path";
import { AgentFileProtocol } from "../../../src/infrastructure/project-knowledge/project/init/AgentFileProtocol";
import { AgentInstructions } from "../../../src/domain/project-knowledge/project/AgentInstructions";

describe("AgentFileProtocol", () => {
  let tmpDir: string;
  let protocol: AgentFileProtocol;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(process.cwd(), "test-agent-files-"));
    protocol = new AgentFileProtocol();
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  describe("ensureAgentsMd()", () => {
    it("should create AGENTS.md if it doesn't exist", async () => {
      // Act
      await protocol.ensureAgentsMd(tmpDir);

      // Assert
      const agentsMdPath = path.join(tmpDir, "AGENTS.md");
      const exists = await fs.pathExists(agentsMdPath);
      expect(exists).toBe(true);

      const content = await fs.readFile(agentsMdPath, "utf-8");
      expect(content).toContain("# AI Agent Instructions");
      expect(content).toContain("## Jumbo Context Management");
    });

    it("should append Jumbo section if AGENTS.md exists without it", async () => {
      // Arrange
      const agentsMdPath = path.join(tmpDir, "AGENTS.md");
      await fs.writeFile(
        agentsMdPath,
        "# AI Agent Instructions\n\nExisting content here.",
        "utf-8"
      );

      // Act
      await protocol.ensureAgentsMd(tmpDir);

      // Assert
      const content = await fs.readFile(agentsMdPath, "utf-8");
      expect(content).toContain("Existing content here.");
      expect(content).toContain("## Jumbo Context Management");
    });

    it("should not duplicate Jumbo section if already present", async () => {
      // Arrange
      const agentsMdPath = path.join(tmpDir, "AGENTS.md");
      const initialContent = AgentInstructions.getFullContent();
      await fs.writeFile(agentsMdPath, initialContent, "utf-8");

      // Act
      await protocol.ensureAgentsMd(tmpDir);

      // Assert
      const content = await fs.readFile(agentsMdPath, "utf-8");
      const occurrences = (content.match(/## Jumbo Context Management/g) || []).length;
      expect(occurrences).toBe(1);
    });

    it("should handle errors gracefully without throwing", async () => {
      // Arrange - use invalid path
      const invalidPath = path.join(tmpDir, "nonexistent", "deeply", "nested");

      // Act & Assert - should not throw
      await expect(protocol.ensureAgentsMd(invalidPath)).resolves.not.toThrow();
    });
  });

  describe("ensureAgentConfigurations()", () => {
    it("should create CLAUDE.md with AGENTS.md reference", async () => {
      // Act
      await protocol.ensureAgentConfigurations(tmpDir);

      // Assert
      const claudeMdPath = path.join(tmpDir, "CLAUDE.md");
      const exists = await fs.pathExists(claudeMdPath);
      expect(exists).toBe(true);

      const content = await fs.readFile(claudeMdPath, "utf-8");
      expect(content).toContain("AGENTS.md");
    });

    it("should create GEMINI.md with AGENTS.md reference", async () => {
      // Act
      await protocol.ensureAgentConfigurations(tmpDir);

      // Assert
      const geminiMdPath = path.join(tmpDir, "GEMINI.md");
      const exists = await fs.pathExists(geminiMdPath);
      expect(exists).toBe(true);

      const content = await fs.readFile(geminiMdPath, "utf-8");
      expect(content).toContain("AGENTS.md");
    });

    it("should create .claude/settings.json with SessionStart hook", async () => {
      // Act
      await protocol.ensureAgentConfigurations(tmpDir);

      // Assert
      const settingsPath = path.join(tmpDir, ".claude", "settings.json");
      const exists = await fs.pathExists(settingsPath);
      expect(exists).toBe(true);

      const content = await fs.readFile(settingsPath, "utf-8");
      const settings = JSON.parse(content);
      expect(settings.hooks?.SessionStart).toBeDefined();
      expect(settings.hooks.SessionStart[0].matcher).toBe("startup");
      expect(settings.hooks.SessionStart[0].hooks[0].command).toBe("jumbo session start");
    });

    it("should create .gemini/settings.json with SessionStart hook", async () => {
      // Act
      await protocol.ensureAgentConfigurations(tmpDir);

      // Assert
      const settingsPath = path.join(tmpDir, ".gemini", "settings.json");
      const exists = await fs.pathExists(settingsPath);
      expect(exists).toBe(true);

      const content = await fs.readFile(settingsPath, "utf-8");
      const settings = JSON.parse(content);
      expect(settings.hooks?.SessionStart).toBeDefined();
      expect(settings.hooks.SessionStart[0].matcher).toBe("startup");
      expect(settings.hooks.SessionStart[0].hooks[0].command).toBe("jumbo session start");
    });

    it("should create .github/copilot-instructions.md with Jumbo instructions", async () => {
      // Act
      await protocol.ensureAgentConfigurations(tmpDir);

      // Assert
      const copilotPath = path.join(tmpDir, ".github", "copilot-instructions.md");
      const exists = await fs.pathExists(copilotPath);
      expect(exists).toBe(true);

      const content = await fs.readFile(copilotPath, "utf-8");
      expect(content).toContain("Jumbo");
    });

    it("should create CURSOR.md with AGENTS.md reference", async () => {
      // Act
      await protocol.ensureAgentConfigurations(tmpDir);

      // Assert
      const cursorMdPath = path.join(tmpDir, "CURSOR.md");
      const exists = await fs.pathExists(cursorMdPath);
      expect(exists).toBe(true);

      const content = await fs.readFile(cursorMdPath, "utf-8");
      expect(content).toContain("AGENTS.md");
    });

    it("should create .cursor/rules/jumbo/RULE.md with Jumbo instructions", async () => {
      // Act
      await protocol.ensureAgentConfigurations(tmpDir);

      // Assert
      const rulePath = path.join(tmpDir, ".cursor", "rules", "jumbo", "RULE.md");
      const exists = await fs.pathExists(rulePath);
      expect(exists).toBe(true);

      const content = await fs.readFile(rulePath, "utf-8");
      expect(content).toContain("alwaysApply: true");
      expect(content).toContain("Jumbo");
    });

    it("should append reference if CLAUDE.md exists without it", async () => {
      // Arrange
      const claudeMdPath = path.join(tmpDir, "CLAUDE.md");
      await fs.writeFile(
        claudeMdPath,
        "# CLAUDE.md\n\nExisting instructions here.",
        "utf-8"
      );

      // Act
      await protocol.ensureAgentConfigurations(tmpDir);

      // Assert
      const content = await fs.readFile(claudeMdPath, "utf-8");
      expect(content).toContain("Existing instructions here.");
      expect(content).toContain("AGENTS.md");
    });

    it("should not duplicate reference if already present in CLAUDE.md", async () => {
      // Arrange
      const claudeMdPath = path.join(tmpDir, "CLAUDE.md");
      const initialContent = AgentInstructions.getAgentFileReference();
      await fs.writeFile(claudeMdPath, initialContent, "utf-8");

      // Act
      await protocol.ensureAgentConfigurations(tmpDir);

      // Assert - verify reference block not duplicated by checking unique marker
      const content = await fs.readFile(claudeMdPath, "utf-8");
      const occurrences = (content.match(/CRITICAL STARTUP INSTRUCTION/g) || []).length;
      expect(occurrences).toBe(1);
    });

    it("should handle all agents independently", async () => {
      // Arrange - Create only CLAUDE.md
      const claudeMdPath = path.join(tmpDir, "CLAUDE.md");
      await fs.writeFile(claudeMdPath, "# CLAUDE.md\n\nExisting content.", "utf-8");

      // Act
      await protocol.ensureAgentConfigurations(tmpDir);

      // Assert - CLAUDE.md updated
      const claudeContent = await fs.readFile(claudeMdPath, "utf-8");
      expect(claudeContent).toContain("AGENTS.md");

      // Assert - GEMINI.md created
      const geminiMdPath = path.join(tmpDir, "GEMINI.md");
      const geminiExists = await fs.pathExists(geminiMdPath);
      expect(geminiExists).toBe(true);

      // Assert - .claude/settings.json created
      const claudeSettingsPath = path.join(tmpDir, ".claude", "settings.json");
      const claudeSettingsExists = await fs.pathExists(claudeSettingsPath);
      expect(claudeSettingsExists).toBe(true);

      // Assert - .gemini/settings.json created
      const geminiSettingsPath = path.join(tmpDir, ".gemini", "settings.json");
      const geminiSettingsExists = await fs.pathExists(geminiSettingsPath);
      expect(geminiSettingsExists).toBe(true);

      // Assert - .github/copilot-instructions.md created
      const copilotPath = path.join(tmpDir, ".github", "copilot-instructions.md");
      const copilotExists = await fs.pathExists(copilotPath);
      expect(copilotExists).toBe(true);

      // Assert - CURSOR.md created
      const cursorMdPath = path.join(tmpDir, "CURSOR.md");
      const cursorMdExists = await fs.pathExists(cursorMdPath);
      expect(cursorMdExists).toBe(true);

      // Assert - .cursor/rules/jumbo/RULE.md created
      const cursorRulePath = path.join(tmpDir, ".cursor", "rules", "jumbo", "RULE.md");
      const cursorRuleExists = await fs.pathExists(cursorRulePath);
      expect(cursorRuleExists).toBe(true);
    });
  });

  describe("idempotency", () => {
    it("should be safe to run ensureAgentsMd multiple times", async () => {
      // Act
      await protocol.ensureAgentsMd(tmpDir);
      await protocol.ensureAgentsMd(tmpDir);
      await protocol.ensureAgentsMd(tmpDir);

      // Assert
      const agentsMdPath = path.join(tmpDir, "AGENTS.md");
      const content = await fs.readFile(agentsMdPath, "utf-8");
      const occurrences = (content.match(/## Jumbo Context Management/g) || []).length;
      expect(occurrences).toBe(1);
    });

    it("should be safe to run ensureAgentConfigurations multiple times", async () => {
      // Act
      await protocol.ensureAgentConfigurations(tmpDir);
      await protocol.ensureAgentConfigurations(tmpDir);
      await protocol.ensureAgentConfigurations(tmpDir);

      // Assert - verify reference block appears only once by checking for unique marker
      const claudeMdPath = path.join(tmpDir, "CLAUDE.md");
      const claudeContent = await fs.readFile(claudeMdPath, "utf-8");
      const claudeOccurrences = (claudeContent.match(/CRITICAL STARTUP INSTRUCTION/g) || []).length;
      expect(claudeOccurrences).toBe(1);

      const geminiMdPath = path.join(tmpDir, "GEMINI.md");
      const geminiContent = await fs.readFile(geminiMdPath, "utf-8");
      const geminiOccurrences = (geminiContent.match(/CRITICAL STARTUP INSTRUCTION/g) || []).length;
      expect(geminiOccurrences).toBe(1);

      // Assert - settings.json not duplicating hooks
      const claudeSettingsPath = path.join(tmpDir, ".claude", "settings.json");
      const claudeSettings = JSON.parse(await fs.readFile(claudeSettingsPath, "utf-8"));
      expect(claudeSettings.hooks.SessionStart.length).toBe(1);
      expect(claudeSettings.hooks.SessionStart[0].hooks.length).toBe(1);
    });
  });
});
