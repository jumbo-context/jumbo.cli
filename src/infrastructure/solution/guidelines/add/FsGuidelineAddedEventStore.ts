/**
 * FsGuidelineAddedEventStore - File system event store for GuidelineAdded event.
 */

import { FsEventStore } from "../../../shared/persistence/FsEventStore.js";
import { IGuidelineAddedEventWriter } from "../../../../application/solution/guidelines/add/IGuidelineAddedEventWriter.js";

export class FsGuidelineAddedEventStore
  extends FsEventStore
  implements IGuidelineAddedEventWriter
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
