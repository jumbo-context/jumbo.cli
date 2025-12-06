/**
 * FsAudienceUpdatedEventStore - File system event store for AudienceUpdated event.
 *
 * Implements IAudienceUpdatedEventWriter for persisting audience update events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../shared/persistence/FsEventStore.js";
import { IAudienceUpdatedEventWriter } from "../../../../application/project-knowledge/audiences/update/IAudienceUpdatedEventWriter.js";

export class FsAudienceUpdatedEventStore
  extends FsEventStore
  implements IAudienceUpdatedEventWriter
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
