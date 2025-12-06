/**
 * FsGuidelineRemovedEventStore - File system event store for GuidelineRemoved event.
 */

import { FsEventStore } from "../../../shared/persistence/FsEventStore.js";
import { IGuidelineRemovedEventWriter } from "../../../../application/solution/guidelines/remove/IGuidelineRemovedEventWriter.js";
import { IGuidelineRemovedEventReader } from "../../../../application/solution/guidelines/remove/IGuidelineRemovedEventReader.js";

export class FsGuidelineRemovedEventStore
  extends FsEventStore
  implements IGuidelineRemovedEventWriter, IGuidelineRemovedEventReader
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
