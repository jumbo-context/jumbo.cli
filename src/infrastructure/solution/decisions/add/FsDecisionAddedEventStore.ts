/**
 * FsDecisionAddedEventStore - File system event store for DecisionAdded event.
 *
 * Implements IDecisionAddedEventWriter for persisting decision add events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../shared/persistence/FsEventStore.js";
import { IDecisionAddedEventWriter } from "../../../../application/solution/decisions/add/IDecisionAddedEventWriter.js";

export class FsDecisionAddedEventStore
  extends FsEventStore
  implements IDecisionAddedEventWriter
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
