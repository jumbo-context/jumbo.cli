/**
 * FsAudienceAddedEventStore - File system event store for AudienceAdded event.
 *
 * Implements IAudienceAddedEventWriter for persisting audience add events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../shared/persistence/FsEventStore.js";
import { IAudienceAddedEventWriter } from "../../../../application/project-knowledge/audiences/add/IAudienceAddedEventWriter.js";

export class FsAudienceAddedEventStore
  extends FsEventStore
  implements IAudienceAddedEventWriter
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
