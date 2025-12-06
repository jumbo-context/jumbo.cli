/**
 * FsComponentAddedEventStore - File system event store for ComponentAdded event.
 *
 * Implements IComponentAddedEventWriter for persisting component add events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../shared/persistence/FsEventStore.js";
import { IComponentAddedEventWriter } from "../../../../application/solution/components/add/IComponentAddedEventWriter.js";

export class FsComponentAddedEventStore
  extends FsEventStore
  implements IComponentAddedEventWriter
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
