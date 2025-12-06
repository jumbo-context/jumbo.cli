/**
 * FsAudienceRemovedEventStore - File system event store for AudienceRemoved event.
 *
 * Implements IAudienceRemovedEventWriter for persisting audience remove events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../shared/persistence/FsEventStore.js";
import { IAudienceRemovedEventWriter } from "../../../../application/project-knowledge/audiences/remove/IAudienceRemovedEventWriter.js";

export class FsAudienceRemovedEventStore
  extends FsEventStore
  implements IAudienceRemovedEventWriter
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
