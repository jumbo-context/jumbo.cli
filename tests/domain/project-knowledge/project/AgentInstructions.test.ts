/**
 * Tests for AgentInstructions value object
 */

import { AgentInstructions } from "../../../../src/domain/project-knowledge/project/AgentInstructions";

describe("AgentInstructions Value Object", () => {
  describe("getJumboSection()", () => {
    it("should return Jumbo section markdown content", () => {
      // Act
      const content = AgentInstructions.getJumboSection();

      // Assert
      expect(content).toContain("## Jumbo Context Management");
      expect(content).toContain("**CRITICAL: This project uses Jumbo for AI context management.**");
      expect(content).toContain("jumbo session start");
      expect(content).toContain("jumbo goal start");
      expect(content).toContain("jumbo component add");
      expect(content).toContain("jumbo decision add");
      expect(content).toContain("jumbo guideline add");
      expect(content).toContain("jumbo invariant add");
      expect(content).toContain("jumbo relation add");
      expect(content).toContain("jumbo --help");
      expect(content).toContain("jumbo capabilities");
    });

    it("should include Working with Jumbo section", () => {
      // Act
      const content = AgentInstructions.getJumboSection();

      // Assert
      expect(content).toContain("### Working with Jumbo");
      expect(content).toContain("1. **Start each session**");
      expect(content).toContain("2. **Start a goal**");
      expect(content).toContain("3. **Capture memories**");
    });

    it("should include Philosophy section", () => {
      // Act
      const content = AgentInstructions.getJumboSection();

      // Assert
      expect(content).toContain("### Philosophy");
      expect(content).toContain("Context determines output quality");
      expect(content).toContain("Guidance over querying");
      expect(content).toContain("Proactive capture");
    });
  });

  describe("getFullContent()", () => {
    it("should return complete AGENTS.md content", () => {
      // Act
      const content = AgentInstructions.getFullContent();

      // Assert
      expect(content).toContain("# AI Agent Instructions");
      expect(content).toContain("This file contains instructions for AI coding agents");
      expect(content).toContain("## Jumbo Context Management");
    });

    it("should include Jumbo section in full content", () => {
      // Act
      const fullContent = AgentInstructions.getFullContent();
      const jumboSection = AgentInstructions.getJumboSection();

      // Assert
      expect(fullContent).toContain(jumboSection);
    });
  });

  describe("getAgentFileReference()", () => {
    it("should return reference text for CLAUDE.md and GEMINI.md", () => {
      // Act
      const reference = AgentInstructions.getAgentFileReference();

      // Assert
      expect(reference).toContain("AGENTS.md");
      expect(reference).toContain("IMPORTANT");
      expect(reference).toContain("further instructions");
    });

    it("should start and end with newlines for proper appending", () => {
      // Act
      const reference = AgentInstructions.getAgentFileReference();

      // Assert
      expect(reference.startsWith("\n")).toBe(true);
      expect(reference.endsWith("\n")).toBe(true);
    });
  });

  describe("getJumboSectionMarker()", () => {
    it("should return the section marker used for detection", () => {
      // Act
      const marker = AgentInstructions.getJumboSectionMarker();

      // Assert
      expect(marker).toBe("## Jumbo Context Management");
    });

    it("should match the marker in getJumboSection()", () => {
      // Act
      const marker = AgentInstructions.getJumboSectionMarker();
      const section = AgentInstructions.getJumboSection();

      // Assert
      expect(section).toContain(marker);
    });
  });
});
