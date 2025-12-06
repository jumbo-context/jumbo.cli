/**
 * FsAudiencePainResolvedEventStore - File system event store for AudiencePainResolved event.
 *
 * Implements IAudiencePainResolvedEventWriter for persisting audience pain resolve events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../shared/persistence/FsEventStore.js";
import { IAudiencePainResolvedEventWriter } from "../../../../application/project-knowledge/audience-pains/resolve/IAudiencePainResolvedEventWriter.js";

export class FsAudiencePainResolvedEventStore
  extends FsEventStore
  implements IAudiencePainResolvedEventWriter
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
