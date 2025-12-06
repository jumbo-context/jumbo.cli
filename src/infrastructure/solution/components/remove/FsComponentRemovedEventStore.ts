/**
 * FsComponentRemovedEventStore - File system event store for ComponentRemoved event.
 *
 * Implements IComponentRemovedEventWriter for persisting component remove events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../shared/persistence/FsEventStore.js";
import { IComponentRemovedEventWriter } from "../../../../application/solution/components/remove/IComponentRemovedEventWriter.js";

export class FsComponentRemovedEventStore
  extends FsEventStore
  implements IComponentRemovedEventWriter
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
