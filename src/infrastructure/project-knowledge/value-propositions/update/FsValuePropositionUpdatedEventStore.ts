/**
 * FsValuePropositionUpdatedEventStore - File system event store for ValuePropositionUpdated event.
 *
 * Implements IValuePropositionUpdatedEventWriter for persisting value proposition update events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../shared/persistence/FsEventStore.js";
import { IValuePropositionUpdatedEventWriter } from "../../../../application/project-knowledge/value-propositions/update/IValuePropositionUpdatedEventWriter.js";

export class FsValuePropositionUpdatedEventStore
  extends FsEventStore
  implements IValuePropositionUpdatedEventWriter
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
