/**
 * FsDependencyAddedEventStore - File system event store for DependencyAdded event.
 *
 * Implements IDependencyAddedEventWriter for persisting dependency add events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../shared/persistence/FsEventStore.js";
import { IDependencyAddedEventWriter } from "../../../../application/solution/dependencies/add/IDependencyAddedEventWriter.js";

export class FsDependencyAddedEventStore
  extends FsEventStore
  implements IDependencyAddedEventWriter
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
