/**
 * FsArchitectureUpdatedEventStore - File system event store for ArchitectureUpdated event.
 */

import { FsEventStore } from "../../../shared/persistence/FsEventStore.js";
import { IArchitectureUpdatedEventWriter } from "../../../../application/solution/architecture/update/IArchitectureUpdatedEventWriter.js";
import { IArchitectureUpdatedEventReader } from "../../../../application/solution/architecture/update/IArchitectureUpdatedEventReader.js";

export class FsArchitectureUpdatedEventStore
  extends FsEventStore
  implements IArchitectureUpdatedEventWriter, IArchitectureUpdatedEventReader
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
