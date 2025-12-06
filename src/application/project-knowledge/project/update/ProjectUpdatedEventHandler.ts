import { IEventHandler } from "../../../shared/messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { ProjectUpdated } from "../../../../domain/project-knowledge/project/update/ProjectUpdatedEvent.js";
import { IProjectUpdatedProjector } from "./IProjectUpdatedProjector.js";

/**
 * Event handler for ProjectUpdated event.
 *
 * Application layer handler that orchestrates projection updates
 * when a project is updated. Subscribes to ProjectUpdated via event bus.
 */
export class ProjectUpdatedEventHandler implements IEventHandler {
  constructor(private readonly projector: IProjectUpdatedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const projectUpdatedEvent = event as ProjectUpdated;
    await this.projector.applyProjectUpdated(projectUpdatedEvent);
  }
}
