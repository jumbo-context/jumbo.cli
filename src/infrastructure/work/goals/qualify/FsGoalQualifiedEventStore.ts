/**
 * FsGoalQualifiedEventStore - File system event store for GoalQualifiedEvent.
 *
 * Implements IGoalQualifiedEventWriter and IGoalQualifiedEventReader for
 * persisting and reading goal qualified events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../shared/persistence/FsEventStore.js";
import { IGoalQualifiedEventWriter } from "../../../../application/work/goals/qualify/IGoalQualifiedEventWriter.js";
import { IGoalQualifiedEventReader } from "../../../../application/work/goals/qualify/IGoalQualifiedEventReader.js";

export class FsGoalQualifiedEventStore
  extends FsEventStore
  implements IGoalQualifiedEventWriter, IGoalQualifiedEventReader
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
