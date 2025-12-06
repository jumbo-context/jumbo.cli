/**
 * FsProjectInitializedEventStore - File system event store for ProjectInitialized event.
 */

import { FsEventStore } from "../../../shared/persistence/FsEventStore.js";
import { IProjectInitializedEventWriter } from "../../../../application/project-knowledge/project/init/IProjectInitializedEventWriter.js";

export class FsProjectInitializedEventStore
  extends FsEventStore
  implements IProjectInitializedEventWriter
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
