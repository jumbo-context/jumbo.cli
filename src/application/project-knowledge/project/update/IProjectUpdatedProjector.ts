/**
 * Port interface for projecting ProjectUpdated events.
 * Infrastructure layer will implement this.
 */

import { ProjectUpdated } from "../../../../domain/project-knowledge/project/update/ProjectUpdatedEvent.js";

export interface IProjectUpdatedProjector {
  /**
   * Applies a ProjectUpdated event to update the materialized view.
   */
  applyProjectUpdated(event: ProjectUpdated): Promise<void>;
}
