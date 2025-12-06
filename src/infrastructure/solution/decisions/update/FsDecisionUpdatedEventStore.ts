/**
 * FsDecisionUpdatedEventStore - File system event store for DecisionUpdated event.
 *
 * Implements IDecisionUpdatedEventWriter for persisting decision update events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../shared/persistence/FsEventStore.js";
import { IDecisionUpdatedEventWriter } from "../../../../application/solution/decisions/update/IDecisionUpdatedEventWriter.js";

export class FsDecisionUpdatedEventStore
  extends FsEventStore
  implements IDecisionUpdatedEventWriter
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
