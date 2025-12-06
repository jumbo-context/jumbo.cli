/**
 * Port interface for writing ProjectUpdated events.
 * Infrastructure layer will implement this with FsEventStore.
 */

import { ProjectUpdated } from "../../../../domain/project-knowledge/project/update/ProjectUpdatedEvent.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { AppendResult } from "../../../shared/persistence/IEventStore.js";

export interface IProjectUpdatedEventWriter {
  /**
   * Appends a ProjectUpdated event to the event store.
   */
  append(event: ProjectUpdated): Promise<AppendResult>;

  /**
   * Reads all events for a project aggregate.
   */
  readStream(aggregateId: string): Promise<BaseEvent[]>;
}
