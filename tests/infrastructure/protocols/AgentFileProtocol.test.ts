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

  describe("ensureAgentFileReferences()", () => {
    it("should create CLAUDE.md if it doesn't exist", async () => {
      // Act
      await protocol.ensureAgentFileReferences(tmpDir);

      // Assert
      const claudeMdPath = path.join(tmpDir, "CLAUDE.md");
      const exists = await fs.pathExists(claudeMdPath);
      expect(exists).toBe(true);

      const content = await fs.readFile(claudeMdPath, "utf-8");
      expect(content).toContain("AGENTS.md");
    });

    it("should create GEMINI.md if it doesn't exist", async () => {
      // Act
      await protocol.ensureAgentFileReferences(tmpDir);

      // Assert
      const geminiMdPath = path.join(tmpDir, "GEMINI.md");
      const exists = await fs.pathExists(geminiMdPath);
      expect(exists).toBe(true);

      const content = await fs.readFile(geminiMdPath, "utf-8");
      expect(content).toContain("AGENTS.md");
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
      await protocol.ensureAgentFileReferences(tmpDir);

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
      await protocol.ensureAgentFileReferences(tmpDir);

      // Assert - verify reference block not duplicated by checking unique marker
      const content = await fs.readFile(claudeMdPath, "utf-8");
      const occurrences = (content.match(/CRITICAL STARTUP INSTRUCTION/g) || []).length;
      expect(occurrences).toBe(1);
    });

    it("should handle both files independently", async () => {
      // Arrange - Create only CLAUDE.md
      const claudeMdPath = path.join(tmpDir, "CLAUDE.md");
      await fs.writeFile(claudeMdPath, "# CLAUDE.md\n\nExisting content.", "utf-8");

      // Act
      await protocol.ensureAgentFileReferences(tmpDir);

      // Assert
      const claudeContent = await fs.readFile(claudeMdPath, "utf-8");
      expect(claudeContent).toContain("AGENTS.md");

      const geminiMdPath = path.join(tmpDir, "GEMINI.md");
      const geminiExists = await fs.pathExists(geminiMdPath);
      expect(geminiExists).toBe(true);

      const geminiContent = await fs.readFile(geminiMdPath, "utf-8");
      expect(geminiContent).toContain("AGENTS.md");
    });

    it("should handle errors gracefully without throwing", async () => {
      // Arrange - use invalid path
      const invalidPath = path.join(tmpDir, "nonexistent", "deeply", "nested");

      // Act & Assert - should not throw
      await expect(protocol.ensureAgentFileReferences(invalidPath)).resolves.not.toThrow();
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

    it("should be safe to run ensureAgentFileReferences multiple times", async () => {
      // Act
      await protocol.ensureAgentFileReferences(tmpDir);
      await protocol.ensureAgentFileReferences(tmpDir);
      await protocol.ensureAgentFileReferences(tmpDir);

      // Assert - verify reference block appears only once by checking for unique marker
      const claudeMdPath = path.join(tmpDir, "CLAUDE.md");
      const claudeContent = await fs.readFile(claudeMdPath, "utf-8");
      const claudeOccurrences = (claudeContent.match(/CRITICAL STARTUP INSTRUCTION/g) || []).length;
      expect(claudeOccurrences).toBe(1);

      const geminiMdPath = path.join(tmpDir, "GEMINI.md");
      const geminiContent = await fs.readFile(geminiMdPath, "utf-8");
      const geminiOccurrences = (geminiContent.match(/CRITICAL STARTUP INSTRUCTION/g) || []).length;
      expect(geminiOccurrences).toBe(1);
    });
  });
});
