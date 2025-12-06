/**
 * FsValuePropositionRemovedEventStore - File system event store for ValuePropositionRemoved event.
 *
 * Implements IValuePropositionRemovedEventWriter for persisting value proposition remove events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../shared/persistence/FsEventStore.js";
import { IValuePropositionRemovedEventWriter } from "../../../../application/project-knowledge/value-propositions/remove/IValuePropositionRemovedEventWriter.js";

export class FsValuePropositionRemovedEventStore
  extends FsEventStore
  implements IValuePropositionRemovedEventWriter
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
