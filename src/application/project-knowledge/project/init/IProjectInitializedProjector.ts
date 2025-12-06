/**
 * Port interface for projecting ProjectInitialized events.
 * Infrastructure layer will implement this.
 */

import { ProjectInitialized } from "../../../../domain/project-knowledge/project/init/ProjectInitializedEvent.js";

export interface IProjectInitializedProjector {
  /**
   * Applies a ProjectInitialized event to update the materialized view.
   */
  applyProjectInitialized(event: ProjectInitialized): Promise<void>;
}
