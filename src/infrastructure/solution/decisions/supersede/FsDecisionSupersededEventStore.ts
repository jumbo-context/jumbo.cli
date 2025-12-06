/**
 * FsDecisionSupersededEventStore - File system event store for DecisionSuperseded event.
 *
 * Implements IDecisionSupersededEventWriter for persisting decision supersede events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../shared/persistence/FsEventStore.js";
import { IDecisionSupersededEventWriter } from "../../../../application/solution/decisions/supersede/IDecisionSupersededEventWriter.js";

export class FsDecisionSupersededEventStore
  extends FsEventStore
  implements IDecisionSupersededEventWriter
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
