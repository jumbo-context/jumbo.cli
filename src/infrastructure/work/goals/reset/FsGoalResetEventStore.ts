/**
 * FsGoalResetEventStore - File system event store for GoalResetEvent.
 *
 * Implements IGoalResetEventWriter and IGoalResetEventReader for
 * persisting and reading goal reset events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../shared/persistence/FsEventStore.js";
import { IGoalResetEventWriter } from "../../../../application/work/goals/reset/IGoalResetEventWriter.js";
import { IGoalResetEventReader } from "../../../../application/work/goals/reset/IGoalResetEventReader.js";

export class FsGoalResetEventStore
  extends FsEventStore
  implements IGoalResetEventWriter, IGoalResetEventReader
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
