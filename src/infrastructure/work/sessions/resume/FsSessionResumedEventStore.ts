/**
 * FsSessionResumedEventStore - File system event store for SessionResumed event.
 *
 * Implements ISessionResumedEventWriter and ISessionResumedEventReader for
 * persisting and reading session resume events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../shared/persistence/FsEventStore.js";
import { ISessionResumedEventWriter } from "../../../../application/work/sessions/resume/ISessionResumedEventWriter.js";
import { ISessionResumedEventReader } from "../../../../application/work/sessions/resume/ISessionResumedEventReader.js";

export class FsSessionResumedEventStore
  extends FsEventStore
  implements ISessionResumedEventWriter, ISessionResumedEventReader
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
