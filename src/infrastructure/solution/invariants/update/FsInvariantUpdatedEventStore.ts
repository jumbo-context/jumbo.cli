/**
 * FsInvariantUpdatedEventStore - File system event store for InvariantUpdated event.
 */

import { FsEventStore } from "../../../shared/persistence/FsEventStore.js";
import { IInvariantUpdatedEventWriter } from "../../../../application/solution/invariants/update/IInvariantUpdatedEventWriter.js";
import { IInvariantUpdatedEventReader } from "../../../../application/solution/invariants/update/IInvariantUpdatedEventReader.js";

export class FsInvariantUpdatedEventStore
  extends FsEventStore
  implements IInvariantUpdatedEventWriter, IInvariantUpdatedEventReader
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
