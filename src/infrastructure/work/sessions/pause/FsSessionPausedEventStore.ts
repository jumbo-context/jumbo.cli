/**
 * FsSessionPausedEventStore - File system event store for SessionPaused event.
 *
 * Implements ISessionPausedEventWriter and ISessionPausedEventReader for
 * persisting and reading session pause events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../shared/persistence/FsEventStore.js";
import { ISessionPausedEventWriter } from "../../../../application/work/sessions/pause/ISessionPausedEventWriter.js";
import { ISessionPausedEventReader } from "../../../../application/work/sessions/pause/ISessionPausedEventReader.js";

export class FsSessionPausedEventStore
  extends FsEventStore
  implements ISessionPausedEventWriter, ISessionPausedEventReader
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
