/**
 * InitializeProjectCommandHandler - Command handler for project initialization.
 *
 * This handler:
 * 1. Validates preconditions (not already initialized)
 * 2. Creates the Project aggregate
 * 3. Executes domain logic (initialize)
 * 4. Persists event to event store
 * 5. Publishes event to event bus for projection updates
 * 6. Creates/updates agent instruction files (AGENTS.md, CLAUDE.md, GEMINI.md)
 * 7. Configures Claude Code SessionStart hook (.claude/settings.json)
 * 8. Creates GitHub Copilot instructions (.github/copilot-instructions.md)
 */

import { InitializeProjectCommand } from "./InitializeProjectCommand.js";
import { IProjectInitializedEventWriter } from "./IProjectInitializedEventWriter.js";
import { IEventBus } from "../../../shared/messaging/IEventBus.js";
import { IProjectInitReader } from "./IProjectInitReader.js";
import { IAgentFileProtocol } from "./IAgentFileProtocol.js";
import { Project } from "../../../../domain/project-knowledge/project/Project.js";
import { ProjectErrorMessages } from "../../../../domain/project-knowledge/project/Constants.js";

export class InitializeProjectCommandHandler {
  constructor(
    private readonly eventWriter: IProjectInitializedEventWriter,
    private readonly eventBus: IEventBus,
    private readonly reader: IProjectInitReader,
    private readonly agentFileProtocol: IAgentFileProtocol
  ) {}

  async execute(
    command: InitializeProjectCommand,
    projectRoot: string
  ): Promise<{ projectId: string }> {
    // Check if project already exists (precondition)
    const existingProject = await this.reader.getProject();
    if (existingProject) {
      throw new Error(ProjectErrorMessages.ALREADY_INITIALIZED);
    }

    // 1. Create new aggregate
    const projectId = "project"; // Single project per codebase
    const project = Project.create(projectId);

    // 2. Domain logic produces event
    const event = project.initialize(
      command.name,
      command.tagline,
      command.purpose,
      command.boundaries
    );

    // 3. Persist event to file store
    await this.eventWriter.append(event);

    // 4. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    // 5. Create/update agent instruction files (side effect)
    await this.agentFileProtocol.ensureAgentsMd(projectRoot);
    await this.agentFileProtocol.ensureAgentFileReferences(projectRoot);

    // 6. Configure Claude Code SessionStart hook (side effect)
    await this.agentFileProtocol.ensureClaudeSettings(projectRoot);

    // 7. Create GitHub Copilot instructions (side effect)
    await this.agentFileProtocol.ensureCopilotInstructions(projectRoot);

    return { projectId };
  }
}
