/**
 * FsInvariantRemovedEventStore - File system event store for InvariantRemoved event.
 */

import { FsEventStore } from "../../../shared/persistence/FsEventStore.js";
import { IInvariantRemovedEventWriter } from "../../../../application/solution/invariants/remove/IInvariantRemovedEventWriter.js";
import { IInvariantRemovedEventReader } from "../../../../application/solution/invariants/remove/IInvariantRemovedEventReader.js";

export class FsInvariantRemovedEventStore
  extends FsEventStore
  implements IInvariantRemovedEventWriter, IInvariantRemovedEventReader
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
