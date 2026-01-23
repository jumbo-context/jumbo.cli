/**
 * Tests for InitializeProjectCommandHandler
 */

import { InitializeProjectCommandHandler } from "../../../../../src/application/project-knowledge/project/init/InitializeProjectCommandHandler.js";
import { InitializeProjectCommand } from "../../../../../src/application/project-knowledge/project/init/InitializeProjectCommand.js";
import { IProjectInitializedEventWriter } from "../../../../../src/application/project-knowledge/project/init/IProjectInitializedEventWriter.js";
import { IProjectInitReader } from "../../../../../src/application/project-knowledge/project/init/IProjectInitReader.js";
import { IAgentFileProtocol } from "../../../../../src/application/project-knowledge/project/init/IAgentFileProtocol.js";
import { ISettingsInitializer } from "../../../../../src/application/shared/settings/ISettingsInitializer.js";
import { IEventBus } from "../../../../../src/application/shared/messaging/IEventBus.js";
import { ProjectErrorMessages, ProjectEventType } from "../../../../../src/domain/project-knowledge/project/Constants.js";
import { ProjectInitializedEvent } from "../../../../../src/domain/project-knowledge/project/init/ProjectInitializedEvent.js";
import { ProjectView } from "../../../../../src/application/project-knowledge/project/ProjectView.js";
import { AppendResult } from "../../../../../src/application/shared/persistence/IEventStore.js";

describe("InitializeProjectCommandHandler", () => {
  let handler: InitializeProjectCommandHandler;
  let eventWriter: jest.Mocked<IProjectInitializedEventWriter>;
  let eventBus: jest.Mocked<IEventBus>;
  let reader: jest.Mocked<IProjectInitReader>;
  let agentFileProtocol: jest.Mocked<IAgentFileProtocol>;
  let settingsInitializer: jest.Mocked<ISettingsInitializer>;

  beforeEach(() => {
    eventWriter = {
      append: jest.fn().mockResolvedValue({ nextSeq: 1 } as AppendResult),
      readStream: jest.fn(),
    };

    eventBus = {
      publish: jest.fn(),
      subscribe: jest.fn(),
    };

    reader = {
      getProject: jest.fn(),
    };

    agentFileProtocol = {
      ensureAgentsMd: jest.fn().mockResolvedValue(undefined),
      ensureAgentConfigurations: jest.fn().mockResolvedValue(undefined),
    };

    settingsInitializer = {
      ensureSettingsFileExists: jest.fn().mockResolvedValue(undefined),
    };

    handler = new InitializeProjectCommandHandler(
      eventWriter,
      eventBus,
      reader,
      agentFileProtocol,
      settingsInitializer
    );
  });

  describe("execute()", () => {
    it("should throw error if project is already initialized", async () => {
      const existingView: ProjectView = {
        projectId: "project",
        name: "Existing Project",
        purpose: "Already set",
        boundaries: [],
        version: 1,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z",
      };

      reader.getProject.mockResolvedValue(existingView);

      const command: InitializeProjectCommand = {
        name: "New Project",
        purpose: "New purpose",
        boundaries: ["out of scope"],
      };

      await expect(handler.execute(command, "/repo")).rejects.toThrow(
        ProjectErrorMessages.ALREADY_INITIALIZED
      );
      expect(eventWriter.append).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
      expect(agentFileProtocol.ensureAgentsMd).not.toHaveBeenCalled();
      expect(agentFileProtocol.ensureAgentConfigurations).not.toHaveBeenCalled();
      expect(settingsInitializer.ensureSettingsFileExists).not.toHaveBeenCalled();
    });

    it("should initialize project and ensure settings file exists", async () => {
      reader.getProject.mockResolvedValue(null);

      const command: InitializeProjectCommand = {
        name: "Jumbo",
        purpose: "LLM context management",
        boundaries: ["mobile app"],
      };

      const result = await handler.execute(command, "/repo");

      expect(result.projectId).toBe("project");
      expect(eventWriter.append).toHaveBeenCalledTimes(1);

      const appendedEvent = eventWriter.append.mock.calls[0][0] as ProjectInitializedEvent;
      expect(appendedEvent.type).toBe(ProjectEventType.INITIALIZED);
      expect(appendedEvent.aggregateId).toBe("project");
      expect(appendedEvent.version).toBe(1);
      expect(appendedEvent.payload.name).toBe(command.name);
      expect(appendedEvent.payload.purpose).toBe(command.purpose);
      expect(appendedEvent.payload.boundaries).toEqual(command.boundaries);

      expect(eventBus.publish).toHaveBeenCalledWith(appendedEvent);
      expect(agentFileProtocol.ensureAgentsMd).toHaveBeenCalledWith("/repo");
      expect(agentFileProtocol.ensureAgentConfigurations).toHaveBeenCalledWith("/repo");
      expect(settingsInitializer.ensureSettingsFileExists).toHaveBeenCalledTimes(1);
    });
  });
});
