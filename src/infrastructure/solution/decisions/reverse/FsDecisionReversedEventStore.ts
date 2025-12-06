/**
 * FsDecisionReversedEventStore - File system event store for DecisionReversed event.
 *
 * Implements IDecisionReversedEventWriter for persisting decision reverse events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../shared/persistence/FsEventStore.js";
import { IDecisionReversedEventWriter } from "../../../../application/solution/decisions/reverse/IDecisionReversedEventWriter.js";

export class FsDecisionReversedEventStore
  extends FsEventStore
  implements IDecisionReversedEventWriter
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
