/**
 * Port interface for writing ProjectInitialized events.
 * Infrastructure layer will implement this with FsEventStore.
 */

import { ProjectInitialized } from "../../../../domain/project-knowledge/project/init/ProjectInitializedEvent.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { AppendResult } from "../../../shared/persistence/IEventStore.js";

export interface IProjectInitializedEventWriter {
  /**
   * Appends a ProjectInitialized event to the event store.
   */
  append(event: ProjectInitialized): Promise<AppendResult>;

  /**
   * Reads all events for a project aggregate.
   */
  readStream(aggregateId: string): Promise<BaseEvent[]>;
}
