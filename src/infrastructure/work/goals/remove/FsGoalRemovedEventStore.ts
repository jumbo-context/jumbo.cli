/**
 * FsGoalRemovedEventStore - File system event store for GoalRemovedEvent.
 *
 * Implements IGoalRemovedEventWriter and IGoalRemovedEventReader for
 * persisting and reading goal removed events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../shared/persistence/FsEventStore.js";
import { IGoalRemovedEventWriter } from "../../../../application/work/goals/remove/IGoalRemovedEventWriter.js";
import { IGoalRemovedEventReader } from "../../../../application/work/goals/remove/IGoalRemovedEventReader.js";

export class FsGoalRemovedEventStore
  extends FsEventStore
  implements IGoalRemovedEventWriter, IGoalRemovedEventReader
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
