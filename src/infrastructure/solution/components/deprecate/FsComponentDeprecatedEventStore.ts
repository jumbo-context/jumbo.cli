/**
 * FsComponentDeprecatedEventStore - File system event store for ComponentDeprecated event.
 *
 * Implements IComponentDeprecatedEventWriter for persisting component deprecate events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../shared/persistence/FsEventStore.js";
import { IComponentDeprecatedEventWriter } from "../../../../application/solution/components/deprecate/IComponentDeprecatedEventWriter.js";

export class FsComponentDeprecatedEventStore
  extends FsEventStore
  implements IComponentDeprecatedEventWriter
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
